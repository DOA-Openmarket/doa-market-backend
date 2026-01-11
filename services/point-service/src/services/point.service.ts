import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '@config/database';
import { PointTransaction, UserPoint, PointType, PointSource } from '@models/Point';
import logger from '@utils/logger';

export interface EarnPointInput {
  userId: string;
  amount: number;
  source: PointSource;
  referenceId?: string;
  description?: string;
  expiresInDays?: number; // 유효기간 (일)
}

export interface UsePointInput {
  userId: string;
  amount: number;
  referenceId?: string;
  description?: string;
}

export class PointService {
  private transactionRepository: Repository<PointTransaction>;
  private userPointRepository: Repository<UserPoint>;

  constructor() {
    this.transactionRepository = AppDataSource.getRepository(PointTransaction);
    this.userPointRepository = AppDataSource.getRepository(UserPoint);
  }

  // 포인트 적립
  async earnPoints(input: EarnPointInput): Promise<PointTransaction> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 사용자 포인트 조회 또는 생성
      let userPoint = await queryRunner.manager.findOne(UserPoint, {
        where: { userId: input.userId },
      });

      if (!userPoint) {
        userPoint = queryRunner.manager.create(UserPoint, {
          userId: input.userId,
          totalPoints: 0,
          availablePoints: 0,
          usedPoints: 0,
          expiredPoints: 0,
        });
      }

      // 포인트 업데이트
      userPoint.totalPoints += input.amount;
      userPoint.availablePoints += input.amount;
      await queryRunner.manager.save(userPoint);

      // 만료일 계산
      let expiresAt: Date | null = null;
      if (input.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
      }

      // 거래 내역 생성
      const transaction = queryRunner.manager.create(PointTransaction, {
        userId: input.userId,
        type: PointType.EARNED,
        source: input.source,
        amount: input.amount,
        balance: userPoint.availablePoints,
        referenceId: input.referenceId || null,
        description: input.description || null,
        expiresAt,
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      logger.info(`Points earned: ${input.amount} for user ${input.userId}`);
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Error earning points:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 포인트 사용
  async usePoints(input: UsePointInput): Promise<PointTransaction> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userPoint = await queryRunner.manager.findOne(UserPoint, {
        where: { userId: input.userId },
      });

      if (!userPoint) {
        throw new Error('User point record not found');
      }

      if (userPoint.availablePoints < input.amount) {
        throw new Error('Insufficient points');
      }

      // 포인트 업데이트
      userPoint.availablePoints -= input.amount;
      userPoint.usedPoints += input.amount;
      await queryRunner.manager.save(userPoint);

      // 거래 내역 생성
      const transaction = queryRunner.manager.create(PointTransaction, {
        userId: input.userId,
        type: PointType.USED,
        source: PointSource.PURCHASE,
        amount: -input.amount,
        balance: userPoint.availablePoints,
        referenceId: input.referenceId || null,
        description: input.description || null,
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      logger.info(`Points used: ${input.amount} for user ${input.userId}`);
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Error using points:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 포인트 환불
  async refundPoints(userId: string, amount: number, referenceId: string): Promise<PointTransaction> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userPoint = await queryRunner.manager.findOne(UserPoint, {
        where: { userId },
      });

      if (!userPoint) {
        throw new Error('User point record not found');
      }

      userPoint.availablePoints += amount;
      userPoint.usedPoints -= amount;
      await queryRunner.manager.save(userPoint);

      const transaction = queryRunner.manager.create(PointTransaction, {
        userId,
        type: PointType.REFUNDED,
        source: PointSource.PURCHASE,
        amount,
        balance: userPoint.availablePoints,
        referenceId,
        description: '주문 취소에 따른 포인트 환불',
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      logger.info(`Points refunded: ${amount} for user ${userId}`);
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Error refunding points:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 사용자 포인트 조회
  async getUserPoints(userId: string): Promise<UserPoint | null> {
    return this.userPointRepository.findOne({
      where: { userId },
    });
  }

  // 거래 내역 조회
  async getTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ transactions: PointTransaction[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      transactions,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 만료 예정 포인트 조회
  async getExpiringPoints(userId: string, daysAhead: number = 30): Promise<number> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: PointType.EARNED })
      .andWhere('transaction.expiresAt <= :futureDate', { futureDate })
      .andWhere('transaction.expiresAt > :now', { now: new Date() })
      .getRawOne();

    return result?.total || 0;
  }

  // 만료된 포인트 처리 (배치 작업용)
  async expirePoints(): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      
      // 만료된 포인트 거래 조회
      const expiredTransactions = await queryRunner.manager.find(PointTransaction, {
        where: {
          type: PointType.EARNED,
          expiresAt: now as any, // Less than or equal
        },
      });

      for (const transaction of expiredTransactions) {
        const userPoint = await queryRunner.manager.findOne(UserPoint, {
          where: { userId: transaction.userId },
        });

        if (userPoint && userPoint.availablePoints >= transaction.amount) {
          userPoint.availablePoints -= transaction.amount;
          userPoint.expiredPoints += transaction.amount;
          await queryRunner.manager.save(userPoint);

          // 만료 거래 내역 생성
          const expireTransaction = queryRunner.manager.create(PointTransaction, {
            userId: transaction.userId,
            type: PointType.EXPIRED,
            source: transaction.source,
            amount: -transaction.amount,
            balance: userPoint.availablePoints,
            referenceId: transaction.id,
            description: '포인트 유효기간 만료',
          });

          await queryRunner.manager.save(expireTransaction);
        }
      }

      await queryRunner.commitTransaction();
      logger.info('Expired points processed successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Error expiring points:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

