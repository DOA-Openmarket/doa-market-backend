import { Request, Response } from 'express';
import { RecentlyViewedService } from '@services/recently-viewed.service';
import logger from '@utils/logger';

const recentlyViewedService = new RecentlyViewedService();

export class RecentlyViewedController {
  // 최근 본 상품 추가/업데이트
  async addRecentlyViewed(req: Request, res: Response): Promise<void> {
    try {
      const item = await recentlyViewedService.addRecentlyViewed(req.body);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error: any) {
      logger.error('Error adding recently viewed:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to add recently viewed',
      });
    }
  }

  // 사용자의 최근 본 상품 목록
  async getRecentlyViewed(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await recentlyViewedService.getRecentlyViewed(userId, page, limit);

      res.json({
        success: true,
        data: result.items,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting recently viewed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get recently viewed',
      });
    }
  }

  // 특정 상품 삭제
  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const { userId, productId } = req.params;
      await recentlyViewedService.removeItem(userId, productId);

      res.json({
        success: true,
        message: 'Item removed successfully',
      });
    } catch (error: any) {
      logger.error('Error removing item:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to remove item',
      });
    }
  }

  // 모두 삭제
  async clearAll(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      await recentlyViewedService.clearAll(userId);

      res.json({
        success: true,
        message: 'All items cleared successfully',
      });
    } catch (error: any) {
      logger.error('Error clearing items:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to clear items',
      });
    }
  }

  // 상품 조회 통계
  async getProductViewStats(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const stats = await recentlyViewedService.getProductViewStats(productId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting product view stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get product view stats',
      });
    }
  }

  // 사용자 관심 분석
  async getUserInterestAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const analysis = await recentlyViewedService.getUserInterestAnalysis(userId);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      logger.error('Error getting user interest analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user interest analysis',
      });
    }
  }
}

export const recentlyViewedController = new RecentlyViewedController();

