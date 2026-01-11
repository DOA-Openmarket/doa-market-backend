import { Router } from 'express';
import Coupon from '../models/coupon.model';
import { Op } from 'sequelize';

const router = Router();

/**
 * @swagger
 * /api/v1/coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: 쿠폰 목록 조회
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: issued_by
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
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

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   get:
 *     tags: [Coupons]
 *     summary: 쿠폰 상세 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
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

/**
 * @swagger
 * /api/v1/coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: 쿠폰 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   put:
 *     tags: [Coupons]
 *     summary: 쿠폰 수정
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
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

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   delete:
 *     tags: [Coupons]
 *     summary: 쿠폰 삭제
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
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

/**
 * @swagger
 * /api/v1/coupons/seller/{sellerId}:
 *   get:
 *     tags: [Coupons]
 *     summary: 판매자별 쿠폰 조회
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
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

/**
 * @swagger
 * /api/v1/coupons/{code}/issue:
 *   post:
 *     tags: [Coupons]
 *     summary: 쿠폰 발급
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/:code/issue', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ where: { code: req.params.code } });
    if (!coupon) {
      return res.status(404).json({ success: false, message: '쿠폰을 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: coupon, message: 'Coupon issued' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

