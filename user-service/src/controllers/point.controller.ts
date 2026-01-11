import { Request, Response, NextFunction } from 'express';
import pointService from '../services/point.service';

export class PointController {
  /**
   * 포인트 요약 정보 조회
   * GET /api/v1/users/:userId/points/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const summary = await pointService.getPointSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 포인트 거래 내역 조회
   * GET /api/v1/users/:userId/points
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await pointService.getPointHistory(userId, page, limit);

      res.json({
        success: true,
        data: result.transactions,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 포인트 사용
   * POST /api/v1/users/:userId/points/use
   */
  async usePoints(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { amount, orderId } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: '올바른 포인트 금액을 입력해주세요',
        });
      }

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: '주문 ID가 필요합니다',
        });
      }

      const transaction = await pointService.usePoints(userId, amount, orderId);

      res.json({
        success: true,
        data: transaction,
        message: '포인트가 사용되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 포인트 적립
   * POST /api/v1/users/:userId/points/earn
   */
  async earnPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { amount, orderId, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: '올바른 포인트 금액을 입력해주세요',
        });
      }

      if (!orderId || !description) {
        return res.status(400).json({
          success: false,
          message: '주문 ID와 설명이 필요합니다',
        });
      }

      const transaction = await pointService.earnPoints(
        userId,
        amount,
        orderId,
        description
      );

      res.json({
        success: true,
        data: transaction,
        message: '포인트가 적립되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PointController();
