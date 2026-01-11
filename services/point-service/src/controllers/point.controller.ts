import { Request, Response } from 'express';
import { PointService } from '@services/point.service';
import logger from '@utils/logger';

const pointService = new PointService();

export class PointController {
  // 포인트 적립
  async earnPoints(req: Request, res: Response): Promise<void> {
    try {
      const transaction = await pointService.earnPoints(req.body);

      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error: any) {
      logger.error('Error earning points:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to earn points',
      });
    }
  }

  // 포인트 사용
  async usePoints(req: Request, res: Response): Promise<void> {
    try {
      const transaction = await pointService.usePoints(req.body);

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error: any) {
      logger.error('Error using points:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to use points',
      });
    }
  }

  // 포인트 환불
  async refundPoints(req: Request, res: Response): Promise<void> {
    try {
      const { userId, amount, referenceId } = req.body;

      if (!userId || !amount || !referenceId) {
        res.status(400).json({
          success: false,
          error: 'userId, amount, and referenceId are required',
        });
        return;
      }

      const transaction = await pointService.refundPoints(userId, amount, referenceId);

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error: any) {
      logger.error('Error refunding points:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to refund points',
      });
    }
  }

  // 사용자 포인트 조회
  async getUserPoints(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const userPoint = await pointService.getUserPoints(userId);

      if (!userPoint) {
        res.status(404).json({
          success: false,
          error: 'User point record not found',
        });
        return;
      }

      // 만료 예정 포인트도 함께 조회
      const expiringPoints = await pointService.getExpiringPoints(userId, 30);

      res.json({
        success: true,
        data: {
          ...userPoint,
          expiringPoints,
        },
      });
    } catch (error: any) {
      logger.error('Error getting user points:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user points',
      });
    }
  }

  // 거래 내역 조회
  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await pointService.getTransactions(userId, page, limit);

      res.json({
        success: true,
        data: result.transactions,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting transactions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get transactions',
      });
    }
  }

  // 만료 예정 포인트 조회
  async getExpiringPoints(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const daysAhead = parseInt(req.query.days as string) || 30;

      const expiringPoints = await pointService.getExpiringPoints(userId, daysAhead);

      res.json({
        success: true,
        data: {
          expiringPoints,
          daysAhead,
        },
      });
    } catch (error: any) {
      logger.error('Error getting expiring points:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get expiring points',
      });
    }
  }
}

export const pointController = new PointController();

