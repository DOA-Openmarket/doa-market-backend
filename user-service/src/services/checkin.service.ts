import { Op } from 'sequelize';
import DailyCheckin from '../models/daily-checkin.model';
import User from '../models/user.model';
import PointService from './point.service';

class CheckinService {
  /**
   * 출석 체크
   */
  async checkIn(userId: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 오늘 이미 출석했는지 확인
    const existingCheckin = await DailyCheckin.findOne({
      where: { userId, checkinDate: today },
    });

    if (existingCheckin) {
      throw new Error('오늘 이미 출석하셨습니다');
    }

    // 사용자 정보 조회
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 연속 출석일 계산
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let consecutiveDays = 1;
    let isBonus = false;
    let bonusPoints = 0;

    if (user.getDataValue('lastCheckinDate') === yesterdayStr) {
      // 어제 출석했으면 연속
      consecutiveDays = (user.getDataValue('consecutiveCheckins') || 0) + 1;
    } else if (user.getDataValue('lastCheckinDate') === today) {
      // 오늘 이미 출석 (중복 방지)
      throw new Error('오늘 이미 출석하셨습니다');
    }

    // 기본 포인트
    let pointsEarned = 10;

    // 연속 출석 보너스
    if (consecutiveDays === 7) {
      bonusPoints = 30;
      isBonus = true;
    } else if (consecutiveDays === 30) {
      bonusPoints = 100;
      isBonus = true;
    }

    pointsEarned += bonusPoints;

    // 출석 기록 생성
    const checkin = await DailyCheckin.create({
      userId,
      checkinDate: today,
      pointsEarned,
      consecutiveDays,
      isBonus,
    });

    // 사용자 출석 정보 업데이트
    await User.update(
      {
        consecutiveCheckins: consecutiveDays,
        lastCheckinDate: today,
      },
      { where: { id: userId } }
    );

    // 포인트 적립
    let description = `출석체크 (${consecutiveDays}일 연속)`;
    if (isBonus) {
      description += ` 🎉 보너스 +${bonusPoints}P`;
    }

    await PointService.earnPoints(userId, pointsEarned, 'daily_checkin', description);

    return {
      checkin,
      pointsEarned,
      consecutiveDays,
      bonusPoints,
      totalPoints: (user.getDataValue('totalPoints') || 0) + pointsEarned,
      message: isBonus
        ? `🎉 ${consecutiveDays}일 연속 출석! 보너스 ${bonusPoints}P 포함 총 ${pointsEarned}P 적립!`
        : `출석 완료! ${pointsEarned}P 적립`,
    };
  }

  /**
   * 출석 현황 조회
   */
  async getCheckinStatus(userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const today = new Date().toISOString().split('T')[0];
    const todayCheckin = await DailyCheckin.findOne({
      where: { userId, checkinDate: today },
    });

    // 이번 달 출석 횟수
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    const thisMonthStartStr = thisMonthStart.toISOString().split('T')[0];

    const thisMonthCount = await DailyCheckin.count({
      where: {
        userId,
        checkinDate: {
          [Op.gte]: thisMonthStartStr,
        },
      },
    });

    // 다음 보너스까지
    const consecutiveDays = user.getDataValue('consecutiveCheckins') || 0;
    let nextBonusDays = 0;
    let nextBonusPoints = 0;

    if (consecutiveDays < 7) {
      nextBonusDays = 7 - consecutiveDays;
      nextBonusPoints = 30;
    } else if (consecutiveDays < 30) {
      nextBonusDays = 30 - consecutiveDays;
      nextBonusPoints = 100;
    }

    return {
      isCheckedInToday: !!todayCheckin,
      consecutiveDays,
      thisMonthCount,
      totalPoints: user.getDataValue('totalPoints') || 0,
      nextBonusDays,
      nextBonusPoints,
      lastCheckinDate: user.getDataValue('lastCheckinDate'),
    };
  }

  /**
   * 출석 달력 조회 (월별)
   */
  async getCheckinCalendar(userId: string, year: number, month: number) {
    // 해당 월의 시작일과 종료일
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const checkins = await DailyCheckin.findAll({
      where: {
        userId,
        checkinDate: {
          [Op.between]: [startDateStr, endDateStr],
        },
      },
      order: [['checkinDate', 'ASC']],
    });

    // 날짜별로 매핑
    const calendar: { [key: string]: any } = {};
    checkins.forEach((checkin) => {
      calendar[checkin.checkinDate] = {
        pointsEarned: checkin.pointsEarned,
        consecutiveDays: checkin.consecutiveDays,
        isBonus: checkin.isBonus,
      };
    });

    return {
      year,
      month,
      checkins: calendar,
      totalDays: checkins.length,
    };
  }

  /**
   * 출석 통계
   */
  async getCheckinStats(userId: string) {
    const totalCheckins = await DailyCheckin.count({
      where: { userId },
    });

    const totalPointsEarned = await DailyCheckin.sum('pointsEarned', {
      where: { userId },
    }) || 0;

    const bonusCount = await DailyCheckin.count({
      where: { userId, isBonus: true },
    });

    const user = await User.findByPk(userId);
    const maxConsecutiveDays = user?.getDataValue('consecutiveCheckins') || 0;

    return {
      totalCheckins,
      totalPointsEarned: Math.round(totalPointsEarned),
      bonusCount,
      maxConsecutiveDays,
    };
  }
}

export default new CheckinService();
