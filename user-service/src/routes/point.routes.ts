import { Router } from 'express';
import pointController from '../controllers/point.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/users/{userId}/points/summary:
 *   get:
 *     tags: [Points]
 *     summary: 포인트 요약 정보 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 포인트 요약 조회 성공
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
 *                     currentBalance:
 *                       type: integer
 *                       description: 현재 보유 포인트
 *                     pendingPoints:
 *                       type: integer
 *                       description: 적립 예정 포인트
 *                     expiringPoints:
 *                       type: integer
 *                       description: 곧 만료될 포인트 (30일 이내)
 *                     nextExpiringDate:
 *                       type: string
 *                       format: date-time
 *                       description: 다음 만료 예정일
 */
router.get('/:userId/points/summary', pointController.getSummary);

/**
 * @swagger
 * /api/v1/users/{userId}/points:
 *   get:
 *     tags: [Points]
 *     summary: 포인트 거래 내역 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 포인트 내역 조회 성공
 */
router.get('/:userId/points', pointController.getHistory);

/**
 * @swagger
 * /api/v1/users/{userId}/points/use:
 *   post:
 *     tags: [Points]
 *     summary: 포인트 사용
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderId
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: 사용할 포인트 금액
 *               orderId:
 *                 type: string
 *                 description: 주문 ID
 *     responses:
 *       200:
 *         description: 포인트 사용 성공
 */
router.post('/:userId/points/use', pointController.usePoints);

/**
 * @swagger
 * /api/v1/users/{userId}/points/earn:
 *   post:
 *     tags: [Points]
 *     summary: 포인트 적립
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderId
 *               - description
 *             properties:
 *               amount:
 *                 type: integer
 *               orderId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 포인트 적립 성공
 */
router.post('/:userId/points/earn', pointController.earnPoints);

export default router;
