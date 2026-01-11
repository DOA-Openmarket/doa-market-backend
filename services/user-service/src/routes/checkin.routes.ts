import { Router } from 'express';
import { CheckinController } from '@controllers/checkin.controller';

const router = Router();

// POST /api/v1/users/:userId/checkin - 출석 체크
router.post('/:userId/checkin', CheckinController.checkIn);

// GET /api/v1/users/:userId/checkin/status - 출석 현황 조회
router.get('/:userId/checkin/status', CheckinController.getCheckinStatus);

// GET /api/v1/users/:userId/checkin/calendar - 출석 달력 조회
router.get('/:userId/checkin/calendar', CheckinController.getCheckinCalendar);

// GET /api/v1/users/:userId/checkin/stats - 출석 통계 조회
router.get('/:userId/checkin/stats', CheckinController.getCheckinStats);

export default router;
