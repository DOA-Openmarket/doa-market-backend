import { Router } from 'express';
import { partnerOrderController } from '@controllers/partner-order.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/orders/partner/orders:
 *   get:
 *     tags: [Partner Orders]
 *     summary: 판매자 주문 목록 조회
 *     parameters:
 *       - in: query
 *         name: sellerId
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/orders', partnerOrderController.getPartnerOrders.bind(partnerOrderController));

/**
 * @swagger
 * /api/v1/orders/partner/orders/counts:
 *   get:
 *     tags: [Partner Orders]
 *     summary: 주문 상태별 개수 조회
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/orders/counts', partnerOrderController.getOrderCounts.bind(partnerOrderController));

/**
 * @swagger
 * /api/v1/orders/partner/orders/{orderId}/status:
 *   patch:
 *     tags: [Partner Orders]
 *     summary: 주문 상태 변경 (판매자용)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.patch('/orders/:orderId/status', partnerOrderController.updateOrderStatus.bind(partnerOrderController));

export default router;
