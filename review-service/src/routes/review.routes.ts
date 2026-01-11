import { Router } from 'express';
import Review from '../models/review.model';
import { Op } from 'sequelize';

const router = Router();

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: 리뷰 목록 조회
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: 리뷰 상세 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     parameters:
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: 리뷰 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - userId
 *               - rating
 *               - content
 *             properties:
 *               productId:
 *                 type: string
 *               userId:
 *                 type: string
 *               rating:
 *                 type: integer
 *               content:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: 리뷰 수정
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
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    await review.update(req.body);
    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: 리뷰 삭제
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
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    await review.destroy();
    res.json({ success: true, message: '리뷰가 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/reviews/products/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: 상품별 리뷰 목록
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/products/:productId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.productId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/reviews/seller/{sellerId}:
 *   get:
 *     tags: [Reviews]
 *     summary: 판매자별 리뷰 조회
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { sellerId: req.params.sellerId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/reviews/{reviewId}/attachments:
 *   get:
 *     tags: [Reviews]
 *     summary: 리뷰 첨부파일 목록
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:reviewId/attachments', async (req, res) => {
  try {
    // TODO: 첨부파일 모델과 연동
    const attachments: any[] = [];
    res.json({ success: true, data: attachments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

