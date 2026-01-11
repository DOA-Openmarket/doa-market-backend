import { Router } from 'express';
import Order from '../models/order.model';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

const router = Router();

/**
 * 판매자 반품 요청 목록 조회
 * GET /api/v1/partner/returns
 */
router.get('/', async (req, res) => {
  try {
    const { sellerId, page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1)) * Number(limit);
    
    const where: any = { sellerId };
    if (status) {
      where.status = status;
    } else {
      // 반품 관련 상태만 조회
      where.status = { [Op.in]: ['return_requested', 'return_approved', 'return_rejected', 'return_pickup_scheduled', 'return_completed'] };
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
    logger.error('Error fetching returns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 반품 상태별 개수 조회
 * GET /api/v1/partner/returns/counts
 */
router.get('/counts', async (req, res) => {
  try {
    const { sellerId } = req.query;
    const where: any = { sellerId };

    const orders = await Order.findAll({ where });
    
    const counts = {
      pending: orders.filter(o => o.status === 'return_requested').length,
      approved: orders.filter(o => o.status === 'return_approved').length,
      rejected: orders.filter(o => o.status === 'return_rejected').length,
      pickup_scheduled: orders.filter(o => o.status === 'return_pickup_scheduled').length,
      completed: orders.filter(o => o.status === 'return_completed').length,
    };

    res.json({ success: true, data: { counts } });
  } catch (error: any) {
    logger.error('Error fetching return counts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 반품 상세 정보 조회
 * GET /api/v1/partner/returns/:returnId
 */
router.get('/:returnId', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.returnId);
    if (!order) {
      return res.status(404).json({ success: false, message: '반품 정보를 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Error fetching return:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 반품 요청 처리
 * PATCH /api/v1/partner/returns/:returnId/process
 */
router.patch('/:returnId/process', async (req, res) => {
  try {
    const { returnId } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'

    const order = await Order.findByPk(returnId);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (action === 'approve') {
      order.status = 'return_approved';
      // TODO: 환불 처리 로직 추가
    } else if (action === 'reject') {
      order.status = 'return_rejected';
    } else {
      return res.status(400).json({ success: false, message: '잘못된 액션입니다.' });
    }

    await order.save();

    logger.info(`Return ${action}ed for order ${returnId}. Reason: ${reason}`);

    res.json({
      success: true,
      data: order,
      message: `반품 요청이 ${action === 'approve' ? '승인' : '거부'}되었습니다.`,
    });
  } catch (error: any) {
    logger.error('Error processing return:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 수거 일정 등록
 * PATCH /api/v1/partner/returns/:returnId/pickup
 */
router.patch('/:returnId/pickup', async (req, res) => {
  try {
    const { returnId } = req.params;
    const { pickupDate, pickupAddress } = req.body;

    const order = await Order.findByPk(returnId);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    order.status = 'return_pickup_scheduled';
    // TODO: 수거 일정 정보 저장 (별도 테이블 또는 order 필드 추가 필요)
    await order.save();

    logger.info(`Pickup scheduled for return ${returnId}`);

    res.json({
      success: true,
      data: order,
      message: '수거 일정이 등록되었습니다.',
    });
  } catch (error: any) {
    logger.error('Error scheduling pickup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 반품 완료 처리
 * PATCH /api/v1/partner/returns/:returnId/complete
 */
router.patch('/:returnId/complete', async (req, res) => {
  try {
    const { returnId } = req.params;

    const order = await Order.findByPk(returnId);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    order.status = 'return_completed';
    await order.save();

    logger.info(`Return completed for order ${returnId}`);

    res.json({
      success: true,
      data: order,
      message: '반품이 완료되었습니다.',
    });
  } catch (error: any) {
    logger.error('Error completing return:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

