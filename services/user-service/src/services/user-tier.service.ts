import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { UserTier, TierHistory, TierLevel, TIER_REQUIREMENTS } from '@models/UserTier';
import logger from '@utils/logger';

export interface UpdateTierStatsInput {
  userId: string;
  purchaseAmount?: number;
  orderCount?: number;
  reviewCount?: number;
}

export class UserTierService {
  private tierRepository: Repository<UserTier>;
  private historyRepository: Repository<TierHistory>;

  constructor() {
    this.tierRepository = AppDataSource.getRepository(UserTier);
    this.historyRepository = AppDataSource.getRepository(TierHistory);
  }

  // 사용자 등급 조회 또는 생성
  async getUserTier(userId: string): Promise<UserTier> {
    let userTier = await this.tierRepository.findOne({
      where: { userId },
    });

    if (!userTier) {
      userTier = this.tierRepository.create({
        userId,
        tier: TierLevel.BRONZE,
        tierBenefits: TIER_REQUIREMENTS[TierLevel.BRONZE].benefits,
      });
      await this.tierRepository.save(userTier);
      logger.info(`User tier created for user: ${userId}`);
    }

    return userTier;
  }

  // 등급 통계 업데이트
  async updateTierStats(input: UpdateTierStatsInput): Promise<UserTier> {
    const userTier = await this.getUserTier(input.userId);

    if (input.purchaseAmount !== undefined) {
      userTier.totalPurchaseAmount += input.purchaseAmount;
    }

    if (input.orderCount !== undefined) {
      userTier.totalOrderCount += input.orderCount;
    }

    if (input.reviewCount !== undefined) {
      userTier.totalReviewCount += input.reviewCount;
    }

    // 등급 재평가
    await this.evaluateTier(userTier);

    await this.tierRepository.save(userTier);
    logger.info(`Tier stats updated for user: ${input.userId}`);

    return userTier;
  }

  // 등급 평가 및 자동 승급
  private async evaluateTier(userTier: UserTier): Promise<void> {
    const currentTier = userTier.tier;
    let newTier = currentTier;

    // 등급 결정 (역순으로 확인하여 가장 높은 등급 찾기)
    const tiers = [
      TierLevel.VIP,
      TierLevel.DIAMOND,
      TierLevel.PLATINUM,
      TierLevel.GOLD,
      TierLevel.SILVER,
      TierLevel.BRONZE,
    ];

    for (const tier of tiers) {
      const requirements = TIER_REQUIREMENTS[tier];
      if (
        userTier.totalPurchaseAmount >= requirements.minPurchaseAmount &&
        userTier.totalOrderCount >= requirements.minOrderCount
      ) {
        newTier = tier;
        break;
      }
    }

    // 등급이 변경된 경우
    if (newTier !== currentTier) {
      const oldTier = currentTier;
      userTier.tier = newTier;
      userTier.tierBenefits = TIER_REQUIREMENTS[newTier].benefits;
      userTier.achievedAt = new Date();

      // 등급 변경 히스토리 기록
      const history = this.historyRepository.create({
        userId: userTier.userId,
        fromTier: oldTier,
        toTier: newTier,
        reason: 'Automatic tier upgrade based on purchase history',
        purchaseAmountAtChange: userTier.totalPurchaseAmount,
      });

      await this.historyRepository.save(history);

      logger.info(`User ${userTier.userId} tier changed from ${oldTier} to ${newTier}`);
    }

    // 다음 등급 및 진행률 계산
    this.calculateNextTierProgress(userTier);
  }

  // 다음 등급까지 진행률 계산
  private calculateNextTierProgress(userTier: UserTier): void {
    const tiers = [
      TierLevel.BRONZE,
      TierLevel.SILVER,
      TierLevel.GOLD,
      TierLevel.PLATINUM,
      TierLevel.DIAMOND,
      TierLevel.VIP,
    ];

    const currentIndex = tiers.indexOf(userTier.tier);
    if (currentIndex === tiers.length - 1) {
      // 이미 최고 등급
      userTier.nextTier = null;
      userTier.nextTierProgress = 100;
      return;
    }

    const nextTier = tiers[currentIndex + 1];
    userTier.nextTier = nextTier;

    const nextRequirements = TIER_REQUIREMENTS[nextTier];
    const currentRequirements = TIER_REQUIREMENTS[userTier.tier];

    // 구매 금액 기준 진행률
    const amountProgress =
      ((userTier.totalPurchaseAmount - currentRequirements.minPurchaseAmount) /
        (nextRequirements.minPurchaseAmount - currentRequirements.minPurchaseAmount)) *
      100;

    // 주문 수 기준 진행률
    const orderProgress =
      ((userTier.totalOrderCount - currentRequirements.minOrderCount) /
        (nextRequirements.minOrderCount - currentRequirements.minOrderCount)) *
      100;

    // 둘 중 낮은 진행률 사용
    userTier.nextTierProgress = Math.min(Math.max(Math.min(amountProgress, orderProgress), 0), 100);
  }

  // 등급 변경 히스토리 조회
  async getTierHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ history: TierHistory[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [history, total] = await this.historyRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      history,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 수동 등급 변경 (관리자용)
  async changeTierManually(
    userId: string,
    newTier: TierLevel,
    reason: string
  ): Promise<UserTier> {
    const userTier = await this.getUserTier(userId);
    const oldTier = userTier.tier;

    userTier.tier = newTier;
    userTier.tierBenefits = TIER_REQUIREMENTS[newTier].benefits;
    userTier.achievedAt = new Date();

    await this.tierRepository.save(userTier);

    // 히스토리 기록
    const history = this.historyRepository.create({
      userId,
      fromTier: oldTier,
      toTier: newTier,
      reason: `Manual change: ${reason}`,
      purchaseAmountAtChange: userTier.totalPurchaseAmount,
    });

    await this.historyRepository.save(history);

    logger.info(`User ${userId} tier manually changed from ${oldTier} to ${newTier}`);

    return userTier;
  }

  // 모든 사용자 등급 재평가 (배치 작업용)
  async reevaluateAllTiers(): Promise<void> {
    const userTiers = await this.tierRepository.find();

    for (const userTier of userTiers) {
      await this.evaluateTier(userTier);
      await this.tierRepository.save(userTier);
    }

    logger.info(`Reevaluated ${userTiers.length} user tiers`);
  }

  // 등급별 사용자 통계
  async getTierStatistics(): Promise<any> {
    const stats = await this.tierRepository
      .createQueryBuilder('tier')
      .select('tier.tier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tier.tier')
      .getRawMany();

    const total = await this.tierRepository.count();

    return {
      total,
      byTier: stats.map(stat => ({
        tier: stat.tier,
        count: parseInt(stat.count),
        percentage: ((parseInt(stat.count) / total) * 100).toFixed(2),
      })),
    };
  }
}

