import { Router } from 'express';
import Order from '../models/order.model';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

const router = Router();

/**
 * 판매자 취소 요청 목록 조회
 * GET /api/v1/partner/cancellations
 */
router.get('/', async (req, res) => {
  try {
    const { sellerId, page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = { sellerId };
    if (status) {
      where.status = status;
    } else {
      // 취소 관련 상태만 조회
      where.status = { [Op.in]: ['cancelled', 'cancellation_requested', 'cancellation_approved', 'cancellation_rejected'] };
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error: any) {
    logger.error('Error fetching cancellations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 취소 상태별 개수 조회
 * GET /api/v1/partner/cancellations/counts
 */
router.get('/counts', async (req, res) => {
  try {
    const { sellerId } = req.query;
    const where: any = { sellerId };

    const orders = await Order.findAll({ where });
    
    const counts = {
      pending: orders.filter(o => o.status === 'cancellation_requested').length,
      approved: orders.filter(o => o.status === 'cancellation_approved').length,
      rejected: orders.filter(o => o.status === 'cancellation_rejected').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    res.json({ success: true, data: { counts } });
  } catch (error: any) {
    logger.error('Error fetching cancellation counts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 취소 요청 처리
 * PATCH /api/v1/partner/cancellations/:orderId/process
 */
router.patch('/:orderId/process', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (action === 'approve') {
      order.status = 'cancellation_approved';
      // TODO: 환불 처리 로직 추가
    } else if (action === 'reject') {
      order.status = 'cancellation_rejected';
    } else {
      return res.status(400).json({ success: false, message: '잘못된 액션입니다.' });
    }

    await order.save();

    logger.info(`Cancellation ${action}ed for order ${orderId}. Reason: ${reason}`);

    res.json({
      success: true,
      data: order,
      message: `취소 요청이 ${action === 'approve' ? '승인' : '거부'}되었습니다.`,
    });
  } catch (error: any) {
    logger.error('Error processing cancellation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

