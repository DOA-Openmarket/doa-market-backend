import { Router } from 'express';
import Settlement from '../models/settlement.model';
import { Op } from 'sequelize';

const router = Router();

// ── 고정 경로 먼저 (/:id 보다 반드시 앞에 위치) ──────────────────────────

// 정산 목록 조회 (관리자 / 판매자 - sellerId 쿼리 파라미터 지원)
router.get('/', async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 20, sellerId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.startDate = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await Settlement.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      settlements: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 통계 조회 — /stats 는 /:id 보다 앞에 있어야 함
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate && endDate) {
      where.startDate = { [Op.between]: [startDate, endDate] };
    }

    const settlements = await Settlement.findAll({ where });
    const stats = {
      totalSettlements: settlements.length,
      totalAmount: settlements.reduce((sum, s) => sum + Number(s.totalAmount), 0),
      totalFeeAmount: settlements.reduce((sum, s) => sum + Number(s.feeAmount), 0),
      totalNetAmount: settlements.reduce((sum, s) => sum + Number(s.netAmount), 0),
      byStatus: {
        pending:    settlements.filter(s => s.status === 'pending').length,
        calculated: settlements.filter(s => s.status === 'calculated').length,
        paid:       settlements.filter(s => s.status === 'paid').length,
        failed:     settlements.filter(s => s.status === 'failed').length,
      },
    };

    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 일정 조회 — /schedule 는 /:id 보다 앞에 있어야 함
router.get('/schedule', async (req, res) => {
  try {
    res.json({
      success: true,
      data: { scheduleType: 'monthly', dayOfMonth: 25, time: '09:00' },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 일정 설정
router.put('/schedule', async (req, res) => {
  try {
    res.json({ success: true, data: req.body, message: '정산 일정이 설정되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 판매자 정산 목록 조회 — /partner/:sellerId 는 /:id 보다 앞에 있어야 함
router.get('/partner/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { sellerId };
    if (status) where.status = status;

    const { count, rows } = await Settlement.findAndCountAll({
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

// 판매자 정산 상세 조회 — /partner/:sellerId/:settlementId
router.get('/partner/:sellerId/:settlementId', async (req, res) => {
  try {
    const { sellerId, settlementId } = req.params;
    const settlement = await Settlement.findOne({ where: { id: settlementId, sellerId } });

    if (!settlement) {
      return res.status(404).json({ success: false, message: '정산을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: settlement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 판매자 상품별 정산 내역 조회
router.get('/partner/products', async (req, res) => {
  try {
    res.json({ success: true, data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 판매자 상품별 정산 상세 조회
router.get('/partner/products/:productId', async (req, res) => {
  try {
    res.json({ success: true, data: { productId: req.params.productId, totalAmount: 0 } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST 액션 라우트 (/:id 보다 앞) ──────────────────────────────────────

// 정산 처리
router.post('/process', async (req, res) => {
  try {
    const { settlementIds, commissionRate } = req.body;
    const settlements = await Settlement.findAll({ where: { id: { [Op.in]: settlementIds } } });

    for (const settlement of settlements) {
      const feeAmount = Number(settlement.totalAmount) * (commissionRate / 100);
      const netAmount = Number(settlement.totalAmount) - feeAmount;
      await settlement.update({ feeAmount, netAmount, status: 'calculated' });
    }

    res.json({ success: true, data: settlements, message: '정산이 처리되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 완료 처리
router.post('/complete', async (req, res) => {
  try {
    const { settlementIds } = req.body;
    await Settlement.update({ status: 'paid' }, { where: { id: { [Op.in]: settlementIds } } });
    res.json({ success: true, message: '정산이 완료되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 보류
router.post('/hold', async (req, res) => {
  try {
    res.json({ success: true, message: '정산이 보류되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 보류 해제
router.post('/unhold', async (req, res) => {
  try {
    res.json({ success: true, message: '정산 보류가 해제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 완료 취소
router.post('/cancel', async (req, res) => {
  try {
    const { settlementIds } = req.body;
    await Settlement.update(
      { status: 'pending' },
      { where: { id: { [Op.in]: settlementIds }, status: 'paid' } }
    );
    res.json({ success: true, message: '정산 완료가 취소되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 동적 경로 (가장 아래) ────────────────────────────────────────────────

// 정산 생성
router.post('/', async (req, res) => {
  try {
    const settlement = await Settlement.create(req.body);
    res.status(201).json({ success: true, data: settlement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 삭제 (bulk)
router.delete('/', async (req, res) => {
  try {
    const { settlementIds } = req.body;
    await Settlement.destroy({ where: { id: { [Op.in]: settlementIds } } });
    res.json({ success: true, message: '정산이 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 상세 조회 — 반드시 모든 고정 경로 뒤에 위치
router.get('/:id', async (req, res) => {
  try {
    const settlement = await Settlement.findByPk(req.params.id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: '정산을 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: settlement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
