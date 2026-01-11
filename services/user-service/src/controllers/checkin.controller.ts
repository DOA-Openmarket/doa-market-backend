import { Request, Response } from 'express';
import { AppDataSource } from '@config/database';
import logger from '@utils/logger';
import { randomUUID } from 'crypto';

export class CheckinController {
  // 출석 체크
  static async checkIn(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today
      const existingCheckin = await AppDataSource.query(
        `SELECT * FROM daily_checkins WHERE "userId" = $1 AND "checkinDate" = $2`,
        [userId, today]
      );

      if (existingCheckin && existingCheckin.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_CHECKED_IN',
            message: '오늘 이미 출석했습니다',
          },
        });
      }

      // Create checkin
      const checkinId = randomUUID();
      await AppDataSource.query(
        `INSERT INTO daily_checkins (id, "userId", "checkinDate", "createdAt") VALUES ($1, $2, $3, NOW())`,
        [checkinId, userId, today]
      );

      // Award points (10 points for daily checkin)
      const pointId = randomUUID();
      await AppDataSource.query(
        `INSERT INTO points (id, "userId", "type", "source", "amount", "description", "balance", "remainingAmount", "usedAmount", "isExpired", "createdAt", "updatedAt")
         VALUES ($1, $2, 'earn', 'daily_checkin', 10, '출석 체크 보너스', 10, 10, 0, false, NOW(), NOW())`,
        [pointId, userId]
      );

      // Update user's total points
      await AppDataSource.query(
        `UPDATE users SET "totalPoints" = "totalPoints" + 10 WHERE id = $1`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          points: 10,
          message: '출석 체크 완료! 10포인트를 받았습니다',
        },
      });
    } catch (error) {
      logger.error('Error checking in:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '출석 체크 중 오류가 발생했습니다',
        },
      });
    }
  }

  // 출석 현황 조회
  static async getCheckinStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's checkin
      const todayCheckin = await AppDataSource.query(
        `SELECT * FROM daily_checkins WHERE "userId" = $1 AND "checkinDate" = $2`,
        [userId, today]
      );

      // Get consecutive checkins
      const consecutiveResult = await AppDataSource.query(
        `SELECT "consecutiveCheckins" FROM users WHERE id = $1`,
        [userId]
      );

      // Get total checkins this month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyCheckins = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM daily_checkins
         WHERE "userId" = $1 AND "checkinDate" >= $2 AND "checkinDate" < $3`,
        [userId, startOfMonth, new Date(today.getFullYear(), today.getMonth() + 1, 1)]
      );

      res.json({
        success: true,
        data: {
          hasCheckedInToday: todayCheckin && todayCheckin.length > 0,
          consecutiveCheckins: consecutiveResult[0]?.consecutiveCheckins || 0,
          monthlyCheckins: parseInt(monthlyCheckins[0]?.count || 0),
          hasNextBonus: false,
        },
      });
    } catch (error) {
      logger.error('Error getting checkin status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '출석 현황을 불러오는데 실패했습니다',
        },
      });
    }
  }

  // 출석 달력 조회
  static async getCheckinCalendar(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { year, month } = req.query;

      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();

      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 1);

      const checkins = await AppDataSource.query(
        `SELECT "checkinDate" FROM daily_checkins
         WHERE "userId" = $1 AND "checkinDate" >= $2 AND "checkinDate" < $3
         ORDER BY "checkinDate"`,
        [userId, startDate, endDate]
      );

      const checkinDates = checkins.map((c: any) => {
        const date = new Date(c.checkinDate);
        return date.getDate();
      });

      res.json({
        success: true,
        data: {
          year: targetYear,
          month: targetMonth + 1,
          checkinDates,
        },
      });
    } catch (error) {
      logger.error('Error getting checkin calendar:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '출석 달력을 불러오는데 실패했습니다',
        },
      });
    }
  }

  // 출석 통계 조회
  static async getCheckinStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const totalCheckins = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM daily_checkins WHERE "userId" = $1`,
        [userId]
      );

      const userInfo = await AppDataSource.query(
        `SELECT "consecutiveCheckins", "totalPoints" FROM users WHERE id = $1`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          totalCheckins: parseInt(totalCheckins[0]?.count || 0),
          consecutiveCheckins: userInfo[0]?.consecutiveCheckins || 0,
          totalPoints: userInfo[0]?.totalPoints || 0,
        },
      });
    } catch (error) {
      logger.error('Error getting checkin stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '출석 통계를 불러오는데 실패했습니다',
        },
      });
    }
  }
}
