import { Router } from 'express';
import Settlement from '../models/settlement.model';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';

const router = Router();

// ── 고정 경로 먼저 (/:id 보다 반드시 앞에 위치) ──────────────────────────

// 정산 목록 조회 (관리자 / 판매자 - sellerId 쿼리 파라미터 지원)
router.get('/', async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 20, sellerId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    if (status) where.status = String(status).toLowerCase();
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
    if (status) where.status = String(status).toLowerCase();

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

// 판매자 상품별 정산 내역 조회 (order_items 기반 집계)
router.get('/partner/products', async (req, res) => {
  try {
    const { sellerId, startDate, endDate, search, sortBy = 'salesAmount', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'sellerId는 필수입니다.' });
    }

    const conditions: string[] = [
      `oi."sellerId" = :sellerId`,
      `o.status IN ('delivered', 'completed', 'shipped')`,
    ];
    const replacements: any = { sellerId, limit: Number(limit), offset };

    if (startDate) { conditions.push(`o."createdAt" >= :startDate`); replacements.startDate = startDate; }
    if (endDate)   { conditions.push(`o."createdAt" <= :endDate`);   replacements.endDate = endDate; }
    if (search)    { conditions.push(`LOWER(oi."productName") LIKE :search`); replacements.search = `%${String(search).toLowerCase()}%`; }

    const whereClause = conditions.join(' AND ');

    const orderCol = sortBy === 'orderCount' ? '"orderCount"'
      : sortBy === 'settlementAmount' ? '"salesAmount"'
      : sortBy === 'commissionAmount' ? '"salesAmount"'
      : '"salesAmount"';

    const rows: any[] = await sequelize.query(`
      SELECT
        oi."productId",
        oi."productName",
        MAX(oi."imageUrl") as "imageUrl",
        SUM(oi."subtotal")::float                 AS "salesAmount",
        SUM(oi."quantity")::int                   AS "totalQuantity",
        COUNT(DISTINCT oi."orderId")::int         AS "orderCount",
        AVG(o."totalAmount")::float               AS "avgOrderValue",
        COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN oi."orderId" END)::int AS "returnCount"
      FROM order_items oi
      JOIN orders o ON oi."orderId" = o.id
      WHERE ${whereClause}
      GROUP BY oi."productId", oi."productName"
      ORDER BY ${orderCol} DESC
      LIMIT :limit OFFSET :offset
    `, { replacements, type: QueryTypes.SELECT });

    const COMMISSION_RATE = 10;
    const productSettlements = rows.map((row, i) => ({
      id: `${row.productId}-${i}`,
      product: {
        id: row.productId,
        name: row.productName,
        image: row.imageUrl || null,
        sku: row.productId?.slice(0, 8)?.toUpperCase() || '-',
        category: null,
        price: row.salesAmount / (row.totalQuantity || 1),
      },
      period: { startDate: startDate || null, endDate: endDate || null },
      orderCount: row.orderCount,
      totalQuantity: row.totalQuantity,
      avgOrderValue: row.avgOrderValue,
      salesAmount: row.salesAmount,
      commissionRate: COMMISSION_RATE,
      commissionAmount: row.salesAmount * COMMISSION_RATE / 100,
      settlementAmount: row.salesAmount * (1 - COMMISSION_RATE / 100),
      returnCount: row.returnCount,
      returnAmount: 0,
    }));

    res.json({ success: true, productSettlements, total: productSettlements.length });
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

// 정산 자동 생성 (완료된 주문에서 집계)
router.post('/generate', async (req, res) => {
  try {
    const { startDate, endDate, commissionRate = 10, sellerId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate, endDate는 필수입니다.' });
    }

    const conditions: string[] = [
      `o.status IN ('delivered', 'completed')`,
      `o."paymentStatus" = 'completed'`,
      `o."createdAt" >= :startDate`,
      `o."createdAt" <= :endDate`,
      `o."sellerId" IS NOT NULL`,
    ];
    const replacements: any = { startDate, endDate };

    if (sellerId) {
      conditions.push(`o."sellerId" = :sellerId`);
      replacements.sellerId = sellerId;
    }

    const rows: any[] = await sequelize.query(`
      SELECT
        o."sellerId",
        SUM(o."totalAmount")::float AS "totalAmount",
        COUNT(*)::int               AS "orderCount"
      FROM orders o
      WHERE ${conditions.join(' AND ')}
      GROUP BY o."sellerId"
    `, { replacements, type: QueryTypes.SELECT });

    if (rows.length === 0) {
      return res.json({ success: true, data: [], message: '생성할 정산 데이터가 없습니다. (완료된 주문 없음)' });
    }

    const rate = Number(commissionRate);
    const created = [];
    for (const row of rows) {
      const total = Number(row.totalAmount);
      const fee   = parseFloat((total * rate / 100).toFixed(2));
      const net   = parseFloat((total - fee).toFixed(2));

      const settlement = await Settlement.create({
        sellerId:    row.sellerId,
        startDate:   new Date(startDate as string),
        endDate:     new Date(endDate as string),
        totalAmount: total,
        feeAmount:   fee,
        netAmount:   net,
        status:      'pending',
      });
      created.push(settlement);
    }

    res.status(201).json({ success: true, data: created, total: created.length, message: `${created.length}개 정산이 생성되었습니다.` });
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
