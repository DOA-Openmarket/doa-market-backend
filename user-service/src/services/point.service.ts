import { Op, Transaction } from 'sequelize';
import Point from '../models/point.model';
import User from '../models/user.model';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

class PointService {
  /**
   * 포인트 요약 정보 조회
   */
  async getPointSummary(userId: string) {
    // 현재 보유 포인트 (마지막 거래의 balance)
    const latestTransaction = await Point.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    const currentBalance = latestTransaction?.balance || 0;

    // 적립 예정 포인트 (pending - 현재는 0으로 반환, 실제로는 배송 완료 대기 중인 주문의 적립 예정 포인트)
    const pendingPoints = 0;

    // 곧 만료될 포인트 (30일 이내 만료)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const expiringPoints = await Point.sum('amount', {
      where: {
        userId,
        type: 'earn',
        expiresAt: {
          [Op.between]: [new Date(), thirtyDaysLater],
        },
      },
    }) || 0;

    // 다음 만료 예정일
    const nextExpiring = await Point.findOne({
      where: {
        userId,
        type: 'earn',
        expiresAt: {
          [Op.gte]: new Date(),
        },
      },
      order: [['expiresAt', 'ASC']],
    });

    return {
      currentBalance,
      pendingPoints,
      expiringPoints: Math.round(expiringPoints),
      nextExpiringDate: nextExpiring?.expiresAt || null,
    };
  }

  /**
   * 포인트 거래 내역 조회
   */
  async getPointHistory(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Point.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      transactions: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 포인트 사용 (FIFO 방식)
   * 먼저 만료되는 포인트부터 순차적으로 사용
   */
  async usePointsWithFIFO(userId: string, amount: number, orderId: string, description: string = '주문 결제 시 포인트 사용') {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // 현재 잔액 확인
      const summary = await this.getPointSummary(userId);

      if (summary.currentBalance < amount) {
        throw new Error('사용 가능한 포인트가 부족합니다');
      }

      // FIFO: 만료일이 빠른 순서대로 사용 가능한 포인트 조회
      const availablePoints = await Point.findAll({
        where: {
          userId,
          type: 'earn',
          isExpired: false,
          remainingAmount: {
            [Op.gt]: 0,
          },
        },
        order: [['expiresAt', 'ASC'], ['createdAt', 'ASC']],
        transaction,
      });

      let remainingAmountToUse = amount;
      const usageRecords: Array<{ pointId: string; usedAmount: number }> = [];

      // 순차적으로 포인트 차감
      for (const point of availablePoints) {
        if (remainingAmountToUse <= 0) break;

        const amountToDeduct = Math.min(point.remainingAmount, remainingAmountToUse);

        // 포인트 잔액 업데이트
        await point.update(
          {
            remainingAmount: point.remainingAmount - amountToDeduct,
            usedAmount: point.usedAmount + amountToDeduct,
          },
          { transaction }
        );

        usageRecords.push({
          pointId: point.id,
          usedAmount: amountToDeduct,
        });

        remainingAmountToUse -= amountToDeduct;
      }

      if (remainingAmountToUse > 0) {
        throw new Error('포인트 차감 중 오류가 발생했습니다');
      }

      const newBalance = summary.currentBalance - amount;

      // 포인트 사용 거래 기록 생성
      const useTransaction = await Point.create(
        {
          userId,
          amount: -amount,
          type: 'use',
          source: 'purchase',
          orderId,
          description,
          balance: newBalance,
          remainingAmount: 0,
          usedAmount: 0,
          isExpired: false,
        },
        { transaction }
      );

      // User 테이블 업데이트
      await User.update(
        { totalPoints: newBalance },
        { where: { id: userId }, transaction }
      );

      await transaction.commit();

      logger.info(`Points used with FIFO: userId=${userId}, amount=${amount}, orderId=${orderId}`);

      return {
        transaction: useTransaction,
        usageRecords,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to use points with FIFO:', error);
      throw error;
    }
  }

  /**
   * 포인트 사용 (레거시 호환성)
   * FIFO 방식으로 리다이렉트
   */
  async usePoints(userId: string, amount: number, orderId: string, source: string = 'purchase') {
    return this.usePointsWithFIFO(userId, amount, orderId, `주문 결제 시 포인트 사용`);
  }

  /**
   * 포인트 적립
   */
  async earnPoints(
    userId: string,
    amount: number,
    source: 'daily_checkin' | 'purchase' | 'review' | 'admin' | 'refund' | 'event',
    description: string,
    orderId?: string
  ) {
    // 현재 잔액 확인
    const summary = await this.getPointSummary(userId);

    // 포인트 만료일 설정 (1년 후)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const newBalance = summary.currentBalance + amount;

    // 포인트 적립 거래 기록
    const transaction = await Point.create({
      userId,
      amount, // 적립은 양수
      type: 'earn',
      source,
      orderId,
      description,
      balance: newBalance,
      expiresAt,
      remainingAmount: amount, // FIFO: 초기 잔여 금액은 적립 금액과 동일
      usedAmount: 0,
      isExpired: false,
    });

    // User 테이블 업데이트
    await User.update(
      { totalPoints: newBalance },
      { where: { id: userId } }
    );

    return transaction;
  }

  /**
   * 만료된 포인트 처리 (스케줄러용)
   */
  async expirePoints() {
    const expiredPoints = await Point.findAll({
      where: {
        type: 'earn',
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    const results = [];

    for (const point of expiredPoints) {
      const summary = await this.getPointSummary(point.userId);

      // 만료 처리 기록
      const expireTransaction = await Point.create({
        userId: point.userId,
        amount: -point.amount,
        type: 'expire',
        description: `포인트 만료 (${point.description})`,
        balance: summary.currentBalance - point.amount,
      });

      results.push(expireTransaction);
    }

    return results;
  }
}

export default new PointService();
