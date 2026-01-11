import { Request, Response, NextFunction } from 'express';
import checkinService from '../services/checkin.service';

export class CheckinController {
  /**
   * 출석 체크
   * POST /api/v1/users/:userId/checkin
   */
  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const result = await checkinService.checkIn(userId);

      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error: any) {
      if (error.message === '오늘 이미 출석하셨습니다') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * 출석 현황 조회
   * GET /api/v1/users/:userId/checkin/status
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const status = await checkinService.getCheckinStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 출석 달력 조회
   * GET /api/v1/users/:userId/checkin/calendar
   */
  async getCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

      if (month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: '올바른 월을 입력해주세요 (1-12)',
        });
      }

      const calendar = await checkinService.getCheckinCalendar(userId, year, month);

      res.json({
        success: true,
        data: calendar,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 출석 통계
   * GET /api/v1/users/:userId/checkin/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const stats = await checkinService.getCheckinStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CheckinController();
