import { Request, Response } from 'express';
import { UserActivityService } from '@services/user-activity.service';
import { ActivityType } from '@models/UserActivity';
import logger from '@utils/logger';

const userActivityService = new UserActivityService();

export class UserActivityController {
  // 활동 기록
  async logActivity(req: Request, res: Response): Promise<void> {
    try {
      const activity = await userActivityService.logActivity(req.body);

      res.status(201).json({
        success: true,
        data: activity,
      });
    } catch (error: any) {
      logger.error('Error logging activity:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to log activity',
      });
    }
  }

  // 사용자 활동 내역 조회
  async getUserActivities(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const activityType = req.query.type as ActivityType | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await userActivityService.getUserActivities(
        userId,
        activityType,
        page,
        limit
      );

      res.json({
        success: true,
        data: result.activities,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting user activities:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user activities',
      });
    }
  }

  // 사용자 통계 조회
  async getUserStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const statistics = await userActivityService.getUserStatistics(userId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      logger.error('Error getting user statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user statistics',
      });
    }
  }

  // 통계 업데이트
  async updateStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await userActivityService.updateStatistics(req.body);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      logger.error('Error updating statistics:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update statistics',
      });
    }
  }

  // 기간별 활동 통계
  async getActivityStatsByPeriod(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      if (!req.query.startDate || !req.query.endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
        return;
      }

      const stats = await userActivityService.getActivityStatsByPeriod(
        userId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting activity stats by period:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get activity stats',
      });
    }
  }

  // 최근 활동 요약
  async getRecentActivitySummary(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const summary = await userActivityService.getRecentActivitySummary(userId, days);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error('Error getting recent activity summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get activity summary',
      });
    }
  }

  // 활동 내역 삭제
  async deleteUserActivities(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const beforeDate = req.query.beforeDate
        ? new Date(req.query.beforeDate as string)
        : undefined;

      const deletedCount = await userActivityService.deleteUserActivities(
        userId,
        beforeDate
      );

      res.json({
        success: true,
        message: `Deleted ${deletedCount} activities`,
        data: { deletedCount },
      });
    } catch (error: any) {
      logger.error('Error deleting user activities:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete activities',
      });
    }
  }
}

export const userActivityController = new UserActivityController();

