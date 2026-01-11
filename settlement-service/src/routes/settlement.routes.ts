import { Router } from 'express';
import Settlement from '../models/settlement.model';
import { Op } from 'sequelize';

const router = Router();

// 정산 목록 조회 (관리자)
router.get('/', async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
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
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 상세 조회
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

// 정산 통계 조회
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
        pending: settlements.filter(s => s.status === 'pending').length,
        calculated: settlements.filter(s => s.status === 'calculated').length,
        paid: settlements.filter(s => s.status === 'paid').length,
        failed: settlements.filter(s => s.status === 'failed').length,
      },
    };

    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 일정 조회
router.get('/schedule', async (req, res) => {
  try {
    // TODO: 정산 일정 설정 조회 로직 구현
    res.json({
      success: true,
      data: {
        scheduleType: 'monthly',
        dayOfMonth: 25,
        time: '09:00',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 일정 설정
router.put('/schedule', async (req, res) => {
  try {
    // TODO: 정산 일정 설정 로직 구현
    res.json({
      success: true,
      data: req.body,
      message: '정산 일정이 설정되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 처리
router.post('/process', async (req, res) => {
  try {
    const { settlementIds, commissionRate } = req.body;
    const settlements = await Settlement.findAll({
      where: { id: { [Op.in]: settlementIds } },
    });

    // 정산 금액 계산 및 상태 업데이트
    for (const settlement of settlements) {
      const feeAmount = Number(settlement.totalAmount) * (commissionRate / 100);
      const netAmount = Number(settlement.totalAmount) - feeAmount;
      
      await settlement.update({
        feeAmount,
        netAmount,
        status: 'calculated',
      });
    }

    res.json({
      success: true,
      data: settlements,
      message: '정산이 처리되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 완료 처리
router.post('/complete', async (req, res) => {
  try {
    const { settlementIds } = req.body;
    await Settlement.update(
      { status: 'paid' },
      { where: { id: { [Op.in]: settlementIds } } }
    );

    res.json({
      success: true,
      message: '정산이 완료되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 보류
router.post('/hold', async (req, res) => {
  try {
    const { settlementIds, memo } = req.body;
    // TODO: 보류 상태 추가 필요
    res.json({
      success: true,
      message: '정산이 보류되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 보류 해제
router.post('/unhold', async (req, res) => {
  try {
    const { settlementIds, memo } = req.body;
    res.json({
      success: true,
      message: '정산 보류가 해제되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 완료 취소
router.post('/cancel', async (req, res) => {
  try {
    const { settlementIds, memo } = req.body;
    await Settlement.update(
      { status: 'pending' },
      { where: { id: { [Op.in]: settlementIds }, status: 'paid' } }
    );

    res.json({
      success: true,
      message: '정산 완료가 취소되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 삭제
router.delete('/', async (req, res) => {
  try {
    const { settlementIds } = req.body;
    await Settlement.destroy({
      where: { id: { [Op.in]: settlementIds } },
    });

    res.json({
      success: true,
      message: '정산이 삭제되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 판매자 정산 목록 조회
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

// 판매자 정산 상세 조회
router.get('/partner/:sellerId/:settlementId', async (req, res) => {
  try {
    const { sellerId, settlementId } = req.params;
    const settlement = await Settlement.findOne({
      where: { id: settlementId, sellerId },
    });

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
    const { sellerId, productId, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { sellerId };
    if (productId) {
      where.productId = productId;
    }

    // TODO: 실제 상품별 정산 데이터 조회
    const productSettlements = {
      data: [],
      total: 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: 0,
    };

    res.json({ success: true, ...productSettlements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 판매자 상품별 정산 상세 조회
router.get('/partner/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { sellerId } = req.query;

    // TODO: 실제 상품별 정산 상세 데이터 조회
    const productSettlement = {
      productId,
      sellerId,
      totalAmount: 0,
      totalCommission: 0,
      netAmount: 0,
      orderCount: 0,
    };

    res.json({ success: true, data: productSettlement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 정산 생성
router.post('/', async (req, res) => {
  try {
    const settlement = await Settlement.create(req.body);
    res.status(201).json({ success: true, data: settlement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

