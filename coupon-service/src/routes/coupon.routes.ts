import { Router } from 'express';
import Coupon from '../models/coupon.model';
import UserCoupon from '../models/user-coupon.model';
import { Op } from 'sequelize';

const router = Router();

// GET / - 쿠폰 목록 조회
router.get('/', async (req, res) => {
  try {
    const { search, issued_by } = req.query;
    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }

    if (issued_by) {
      where.issuedBy = issued_by;
    }

    const { count, rows } = await Coupon.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: rows, total: count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /seller/:sellerId - 판매자별 쿠폰 조회 (/:id 보다 먼저 등록)
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      where: { issuedBy: req.params.sellerId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /user/me - 내 쿠폰함 조회 (JWT x-user-id 헤더 사용)
router.get('/user/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const userCoupons = await UserCoupon.findAll({
      where: { userId },
      order: [['issuedAt', 'DESC']],
    });

    const couponIds = userCoupons.map((uc: any) => uc.getDataValue('couponId'));
    if (couponIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const coupons = await Coupon.findAll({ where: { id: couponIds } });

    // userCoupon 정보를 coupon에 병합 (getDataValue로 class field shadowing 우회)
    const result = userCoupons.map((uc: any) => {
      const coupon = coupons.find((c: any) => c.getDataValue('id') === uc.getDataValue('couponId'));
      return {
        ...(coupon ? coupon.toJSON() : {}),
        userCouponId: uc.getDataValue('id'),
        issuedAt: uc.getDataValue('issuedAt'),
        usedAt: uc.getDataValue('usedAt'),
      };
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /:id - 쿠폰 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: '쿠폰을 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST / - 쿠폰 생성
router.post('/', async (req, res) => {
  try {
    const frontendData = req.body;

    const generateCode = () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      return `COUPON-${timestamp}-${random}`.toUpperCase();
    };

    const discountTypeMap: { [key: string]: string } = {
      'amount': 'fixed',
      'percent': 'percentage',
      'percentage': 'percentage',
      'fixed': 'fixed'
    };

    const backendData = {
      code: frontendData.code || generateCode(),
      name: frontendData.title || frontendData.name || 'Unnamed Coupon',
      discountType: discountTypeMap[frontendData.discount_mode] || frontendData.discountType || 'fixed',
      discountValue: Number(frontendData.discount_amount || frontendData.discountValue || 0),
      minOrderAmount: frontendData.min_order_amount ? Number(frontendData.min_order_amount) : null,
      maxDiscountAmount: frontendData.discount_max ? Number(frontendData.discount_max) : null,
      startDate: frontendData.start_date || frontendData.valid_from || frontendData.startDate || new Date(),
      endDate: frontendData.end_date || frontendData.valid_to || frontendData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      issuedBy: frontendData.issued_by || frontendData.issuedBy || null,
      totalCount: frontendData.total_count ? Number(frontendData.total_count) : null,
    };

    const coupon = await Coupon.create(backendData);
    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /:id - 쿠폰 수정
router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: '쿠폰을 찾을 수 없습니다.' });
    }
    await coupon.update(req.body);
    res.json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /:id - 쿠폰 삭제
router.delete('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: '쿠폰을 찾을 수 없습니다.' });
    }
    await coupon.destroy();
    res.json({ success: true, message: '쿠폰이 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /:code/issue - 쿠폰 발급 (user_coupons에 기록)
router.post('/:code/issue', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const coupon = await Coupon.findOne({ where: { code: req.params.code } });
    if (!coupon) {
      return res.status(404).json({ success: false, message: '쿠폰을 찾을 수 없습니다.' });
    }

    const couponId = coupon.getDataValue('id');

    // 이미 발급된 쿠폰 중복 방지
    const existing = await UserCoupon.findOne({ where: { userId, couponId } });
    if (existing) {
      return res.status(409).json({ success: false, message: '이미 발급된 쿠폰입니다.' });
    }

    await UserCoupon.create({ userId, couponId });
    await coupon.increment('usedCount', { by: 1 });
    await coupon.reload();
    res.json({ success: true, data: coupon, message: 'Coupon issued' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
