import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { RecentlyViewed } from '@models/RecentlyViewed';
import logger from '@utils/logger';

export interface AddRecentlyViewedInput {
  userId: string;
  productId: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  sellerName?: string;
}

export class RecentlyViewedService {
  private repository: Repository<RecentlyViewed>;
  private readonly MAX_ITEMS = 100; // 사용자당 최대 보관 개수

  constructor() {
    this.repository = AppDataSource.getRepository(RecentlyViewed);
  }

  // 최근 본 상품 추가/업데이트
  async addRecentlyViewed(input: AddRecentlyViewedInput): Promise<RecentlyViewed> {
    // 기존 기록 확인
    let recentlyViewed = await this.repository.findOne({
      where: {
        userId: input.userId,
        productId: input.productId,
      },
    });

    if (recentlyViewed) {
      // 이미 존재하면 조회 시간과 횟수 업데이트
      recentlyViewed.viewedAt = new Date();
      recentlyViewed.viewCount += 1;
      
      // 상품 정보 업데이트
      if (input.productName) recentlyViewed.productName = input.productName;
      if (input.productPrice !== undefined) recentlyViewed.productPrice = input.productPrice;
      if (input.productImage) recentlyViewed.productImage = input.productImage;
      if (input.sellerName) recentlyViewed.sellerName = input.sellerName;
    } else {
      // 새로 추가
      recentlyViewed = this.repository.create({
        userId: input.userId,
        productId: input.productId,
        viewedAt: new Date(),
        viewCount: 1,
        productName: input.productName || null,
        productPrice: input.productPrice || null,
        productImage: input.productImage || null,
        sellerName: input.sellerName || null,
      });
    }

    await this.repository.save(recentlyViewed);

    // 최대 개수 초과 시 오래된 항목 삭제
    await this.pruneOldItems(input.userId);

    logger.info(`Recently viewed added for user ${input.userId}: product ${input.productId}`);

    return recentlyViewed;
  }

  // 사용자의 최근 본 상품 목록 조회
  async getRecentlyViewed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: RecentlyViewed[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.repository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { viewedAt: 'DESC' },
    });

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 특정 상품 삭제
  async removeItem(userId: string, productId: string): Promise<void> {
    const result = await this.repository.delete({
      userId,
      productId,
    });

    if (result.affected === 0) {
      throw new Error('Item not found');
    }

    logger.info(`Recently viewed removed: user ${userId}, product ${productId}`);
  }

  // 모두 삭제
  async clearAll(userId: string): Promise<void> {
    await this.repository.delete({ userId });
    logger.info(`All recently viewed cleared for user ${userId}`);
  }

  // 오래된 항목 정리 (최대 개수 초과 시)
  private async pruneOldItems(userId: string): Promise<void> {
    const count = await this.repository.count({ where: { userId } });

    if (count > this.MAX_ITEMS) {
      const itemsToDelete = await this.repository.find({
        where: { userId },
        order: { viewedAt: 'ASC' },
        take: count - this.MAX_ITEMS,
      });

      if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(item => item.id);
        await this.repository.delete(idsToDelete);
        logger.info(`Pruned ${itemsToDelete.length} old items for user ${userId}`);
      }
    }
  }

  // 상품별 조회 통계 (인기 상품 분석용)
  async getProductViewStats(
    productId: string
  ): Promise<{ totalViews: number; uniqueUsers: number }> {
    const result = await this.repository
      .createQueryBuilder('rv')
      .select('SUM(rv.viewCount)', 'totalViews')
      .addSelect('COUNT(DISTINCT rv.userId)', 'uniqueUsers')
      .where('rv.productId = :productId', { productId })
      .getRawOne();

    return {
      totalViews: parseInt(result?.totalViews) || 0,
      uniqueUsers: parseInt(result?.uniqueUsers) || 0,
    };
  }

  // 사용자의 관심 카테고리 분석 (추천 시스템용)
  async getUserInterestAnalysis(userId: string): Promise<any> {
    // 최근 30일간의 데이터만 사용
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await this.repository.find({
      where: {
        userId,
      },
      order: { viewedAt: 'DESC' },
      take: 50, // 최근 50개만
    });

    // 가격대 분석
    const prices = items
      .filter(item => item.productPrice !== null)
      .map(item => item.productPrice!);

    const avgPrice = prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      totalViews: items.length,
      avgPrice: Math.round(avgPrice),
      priceRange: {
        min: minPrice,
        max: maxPrice,
      },
      recentProducts: items.slice(0, 10).map(item => item.productId),
    };
  }
}

