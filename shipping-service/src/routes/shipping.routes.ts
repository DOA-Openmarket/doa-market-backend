import { Router } from 'express';
import Shipping from '../models/shipping.model';
import { Op } from 'sequelize';

const router = Router();

// 전체 배송 목록 조회
router.get('/', async (req, res) => {
  try {
    const shippings = await Shipping.findAll();
    res.json({ success: true, data: shippings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 판매자 배송 목록 조회
router.get('/partner', async (req, res) => {
  try {
    const { sellerId, page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    if (status) where.status = status;

    const { count, rows } = await Shipping.findAndCountAll({
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// 배송 상태별 개수 조회
router.get('/partner/counts', async (req, res) => {
  try {
    const { sellerId } = req.query;
    const where: any = {};
    if (sellerId) where.sellerId = sellerId;

    const shippings = await Shipping.findAll({ where });
    
    const counts = {
      pending: shippings.filter(s => s.status === 'pending').length,
      shipped: shippings.filter(s => s.status === 'shipped').length,
      in_transit: shippings.filter(s => s.status === 'in_transit').length,
      delivered: shippings.filter(s => s.status === 'delivered').length,
      cancelled: shippings.filter(s => s.status === 'cancelled').length,
    };

    res.json({ success: true, data: { counts } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 배송 시작
router.patch('/partner/:orderId/start', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier } = req.body;

    const shipping = await Shipping.findOne({ where: { orderId } });
    if (!shipping) {
      return res.status(404).json({ success: false, message: '배송 정보를 찾을 수 없습니다.' });
    }

    await shipping.update({
      status: 'shipped',
      trackingNumber,
      carrier,
      shippedAt: new Date(),
    });

    res.json({
      success: true,
      data: shipping,
      message: '배송이 시작되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 운송장 번호 업데이트
router.patch('/partner/:orderId/tracking', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier } = req.body;

    const shipping = await Shipping.findOne({ where: { orderId } });
    if (!shipping) {
      return res.status(404).json({ success: false, message: '배송 정보를 찾을 수 없습니다.' });
    }

    await shipping.update({
      trackingNumber,
      carrier,
    });

    res.json({
      success: true,
      data: shipping,
      message: '운송장 번호가 업데이트되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 배송 생성
router.post('/', async (req, res) => {
  try {
    const shipping = await Shipping.create(req.body);
    res.status(201).json({ success: true, data: shipping });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 배송 추적
router.get('/:id/track', async (req, res) => {
  try {
    const shipping = await Shipping.findByPk(req.params.id);
    if (!shipping) {
      return res.status(404).json({ success: false, message: '배송 정보를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: shipping });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

