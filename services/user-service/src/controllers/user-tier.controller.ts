import { Request, Response } from 'express';
import { UserTierService } from '@services/user-tier.service';
import { TierLevel } from '@models/UserTier';
import logger from '@utils/logger';

const userTierService = new UserTierService();

export class UserTierController {
  // 사용자 등급 조회
  async getUserTier(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const userTier = await userTierService.getUserTier(userId);

      res.json({
        success: true,
        data: userTier,
      });
    } catch (error: any) {
      logger.error('Error getting user tier:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user tier',
      });
    }
  }

  // 등급 통계 업데이트
  async updateTierStats(req: Request, res: Response): Promise<void> {
    try {
      const userTier = await userTierService.updateTierStats(req.body);

      res.json({
        success: true,
        data: userTier,
      });
    } catch (error: any) {
      logger.error('Error updating tier stats:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update tier stats',
      });
    }
  }

  // 등급 변경 히스토리 조회
  async getTierHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await userTierService.getTierHistory(userId, page, limit);

      res.json({
        success: true,
        data: result.history,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting tier history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tier history',
      });
    }
  }

  // 수동 등급 변경 (관리자용)
  async changeTierManually(req: Request, res: Response): Promise<void> {
    try {
      const { userId, newTier, reason } = req.body;

      if (!userId || !newTier || !reason) {
        res.status(400).json({
          success: false,
          error: 'userId, newTier, and reason are required',
        });
        return;
      }

      const userTier = await userTierService.changeTierManually(userId, newTier as TierLevel, reason);

      res.json({
        success: true,
        data: userTier,
      });
    } catch (error: any) {
      logger.error('Error changing tier manually:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change tier manually',
      });
    }
  }

  // 등급별 사용자 통계 (관리자용)
  async getTierStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await userTierService.getTierStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting tier statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tier statistics',
      });
    }
  }
}

export const userTierController = new UserTierController();

