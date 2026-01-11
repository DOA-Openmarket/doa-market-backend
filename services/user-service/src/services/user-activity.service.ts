import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { UserActivity, UserStatistics, ActivityType } from '@models/UserActivity';
import logger from '@utils/logger';

export interface LogActivityInput {
  userId: string;
  activityType: ActivityType;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateStatisticsInput {
  userId: string;
  totalOrders?: number;
  completedOrders?: number;
  cancelledOrders?: number;
  totalSpent?: number;
  productsViewed?: number;
  productsLiked?: number;
  wishlistItems?: number;
  reviewsWritten?: number;
  averageRatingGiven?: number;
  inquiriesMade?: number;
  qnasAsked?: number;
  firstOrderAt?: Date;
  lastOrderAt?: Date;
  lastLoginAt?: Date;
}

export class UserActivityService {
  private activityRepository: Repository<UserActivity>;
  private statisticsRepository: Repository<UserStatistics>;

  constructor() {
    this.activityRepository = AppDataSource.getRepository(UserActivity);
    this.statisticsRepository = AppDataSource.getRepository(UserStatistics);
  }

  // 활동 기록
  async logActivity(input: LogActivityInput): Promise<UserActivity> {
    const activity = this.activityRepository.create({
      userId: input.userId,
      activityType: input.activityType,
      referenceId: input.referenceId || null,
      description: input.description || null,
      metadata: input.metadata || {},
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
    });

    await this.activityRepository.save(activity);
    logger.info(`Activity logged: ${input.activityType} for user ${input.userId}`);

    return activity;
  }

  // 사용자 활동 내역 조회
  async getUserActivities(
    userId: string,
    activityType?: ActivityType,
    page: number = 1,
    limit: number = 50
  ): Promise<{ activities: UserActivity[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId });

    if (activityType) {
      queryBuilder.andWhere('activity.activityType = :activityType', { activityType });
    }

    const [activities, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('activity.createdAt', 'DESC')
      .getManyAndCount();

    return {
      activities,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 사용자 통계 조회 또는 생성
  async getUserStatistics(userId: string): Promise<UserStatistics> {
    let statistics = await this.statisticsRepository.findOne({
      where: { userId },
    });

    if (!statistics) {
      statistics = this.statisticsRepository.create({
        userId,
      });
      await this.statisticsRepository.save(statistics);
      logger.info(`Statistics created for user: ${userId}`);
    }

    return statistics;
  }

  // 통계 업데이트
  async updateStatistics(input: UpdateStatisticsInput): Promise<UserStatistics> {
    const statistics = await this.getUserStatistics(input.userId);

    // 증분 업데이트
    if (input.totalOrders !== undefined) {
      statistics.totalOrders += input.totalOrders;
    }

    if (input.completedOrders !== undefined) {
      statistics.completedOrders += input.completedOrders;
    }

    if (input.cancelledOrders !== undefined) {
      statistics.cancelledOrders += input.cancelledOrders;
    }

    if (input.totalSpent !== undefined) {
      statistics.totalSpent += input.totalSpent;

      // 평균 주문 금액 계산
      if (statistics.completedOrders > 0) {
        statistics.averageOrderValue = Math.floor(
          statistics.totalSpent / statistics.completedOrders
        );
      }
    }

    if (input.productsViewed !== undefined) {
      statistics.productsViewed += input.productsViewed;
    }

    if (input.productsLiked !== undefined) {
      statistics.productsLiked += input.productsLiked;
    }

    if (input.wishlistItems !== undefined) {
      statistics.wishlistItems += input.wishlistItems;
    }

    if (input.reviewsWritten !== undefined) {
      statistics.reviewsWritten += input.reviewsWritten;
    }

    if (input.averageRatingGiven !== undefined) {
      statistics.averageRatingGiven = input.averageRatingGiven;
    }

    if (input.inquiriesMade !== undefined) {
      statistics.inquiriesMade += input.inquiriesMade;
    }

    if (input.qnasAsked !== undefined) {
      statistics.qnasAsked += input.qnasAsked;
    }

    // 절대값 설정
    if (input.firstOrderAt) {
      statistics.firstOrderAt = input.firstOrderAt;
    }

    if (input.lastOrderAt) {
      statistics.lastOrderAt = input.lastOrderAt;
    }

    if (input.lastLoginAt) {
      statistics.lastLoginAt = input.lastLoginAt;
    }

    statistics.updatedAt = new Date();
    await this.statisticsRepository.save(statistics);

    logger.info(`Statistics updated for user: ${input.userId}`);

    return statistics;
  }

  // 특정 기간 활동 통계
  async getActivityStatsByPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    // 활동 타입별 집계
    const activityCounts: Record<string, number> = {};
    activities.forEach(activity => {
      activityCounts[activity.activityType] =
        (activityCounts[activity.activityType] || 0) + 1;
    });

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totalActivities: activities.length,
      activityCounts,
    };
  }

  // 최근 활동 요약
  async getRecentActivitySummary(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.createdAt >= :startDate', { startDate })
      .orderBy('activity.createdAt', 'DESC')
      .take(100)
      .getMany();

    // 타입별 분류
    const orderActivities = activities.filter(a =>
      a.activityType.startsWith('order_')
    );
    const reviewActivities = activities.filter(a =>
      a.activityType.startsWith('review_')
    );
    const productActivities = activities.filter(
      a =>
        a.activityType === ActivityType.PRODUCT_VIEWED ||
        a.activityType === ActivityType.PRODUCT_LIKED
    );

    return {
      period: days,
      totalActivities: activities.length,
      orderCount: orderActivities.length,
      reviewCount: reviewActivities.length,
      productViewCount: productActivities.length,
      recentActivities: activities.slice(0, 10),
    };
  }

  // 활동 내역 삭제 (개인정보 보호)
  async deleteUserActivities(userId: string, beforeDate?: Date): Promise<number> {
    const queryBuilder = this.activityRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId });

    if (beforeDate) {
      queryBuilder.andWhere('createdAt < :beforeDate', { beforeDate });
    }

    const result = await queryBuilder.execute();

    logger.info(`Deleted ${result.affected} activities for user ${userId}`);

    return result.affected || 0;
  }
}

