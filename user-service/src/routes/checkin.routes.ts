import { Router } from 'express';
import checkinController from '../controllers/checkin.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/users/{userId}/checkin:
 *   post:
 *     tags: [Checkin]
 *     summary: 출석 체크
 *     description: 하루에 한 번 출석하고 포인트를 획득합니다
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 출석 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     pointsEarned:
 *                       type: integer
 *                       description: 획득한 포인트
 *                     consecutiveDays:
 *                       type: integer
 *                       description: 연속 출석일
 *                     bonusPoints:
 *                       type: integer
 *                       description: 보너스 포인트
 *                     totalPoints:
 *                       type: integer
 *                       description: 총 보유 포인트
 *                 message:
 *                   type: string
 *       400:
 *         description: 이미 출석했거나 오류 발생
 */
router.post('/:userId/checkin', checkinController.checkIn);

/**
 * @swagger
 * /api/v1/users/{userId}/checkin/status:
 *   get:
 *     tags: [Checkin]
 *     summary: 출석 현황 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 출석 현황 조회 성공
 */
router.get('/:userId/checkin/status', checkinController.getStatus);

/**
 * @swagger
 * /api/v1/users/{userId}/checkin/calendar:
 *   get:
 *     tags: [Checkin]
 *     summary: 출석 달력 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 연도 (기본값: 올해)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: 월 (1-12, 기본값: 이번 달)
 *     responses:
 *       200:
 *         description: 출석 달력 조회 성공
 */
router.get('/:userId/checkin/calendar', checkinController.getCalendar);

/**
 * @swagger
 * /api/v1/users/{userId}/checkin/stats:
 *   get:
 *     tags: [Checkin]
 *     summary: 출석 통계 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 출석 통계 조회 성공
 */
router.get('/:userId/checkin/stats', checkinController.getStats);

export default router;
