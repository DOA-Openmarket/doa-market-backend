import { Router } from 'express';
import Inquiry from '../models/inquiry.model';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/inquiries:
 *   get:
 *     summary: 문의사항 목록 조회
 *     tags: [Inquiries]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const { count, rows } = await Inquiry.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries/{id}:
 *   get:
 *     summary: 문의사항 상세 조회
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: '문의사항을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: inquiry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries:
 *   post:
 *     summary: 문의사항 생성
 *     tags: [Inquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 생성 성공
 */
router.post('/', async (req, res) => {
  try {
    const inquiry = await Inquiry.create(req.body);
    res.status(201).json({ success: true, data: inquiry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries/{id}/answer:
 *   post:
 *     summary: 문의사항 답변
 *     tags: [Inquiries]
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
 *             properties:
 *               answer:
 *                 type: string
 *               answeredBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: 답변 성공
 */
router.post('/:id/answer', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: '문의사항을 찾을 수 없습니다.' });
    }

    await inquiry.update({
      answer: req.body.answer,
      answeredBy: req.body.answeredBy,
      answeredAt: new Date(),
      status: 'answered',
    });

    res.json({ success: true, data: inquiry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries/{id}/status:
 *   patch:
 *     summary: 문의사항 상태 변경
 *     tags: [Inquiries]
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
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: 상태 변경 성공
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: '문의사항을 찾을 수 없습니다.' });
    }

    await inquiry.update({ status: req.body.status });
    res.json({ success: true, data: inquiry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries/{id}:
 *   put:
 *     summary: 문의사항 수정
 *     tags: [Inquiries]
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
 *         description: 수정 성공
 */
router.put('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: '문의사항을 찾을 수 없습니다.' });
    }

    await inquiry.update(req.body);
    res.json({ success: true, data: inquiry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries/{id}/attachments:
 *   get:
 *     summary: 문의사항 첨부파일 목록
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/:id/attachments', async (req, res) => {
  try {
    // TODO: 첨부파일 모델과 연동
    const attachments: any[] = [];
    res.json({ success: true, data: attachments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries/seller/{sellerId}:
 *   get:
 *     summary: 판매자 문의 조회
 *     tags: [Inquiries]
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
 *         description: 성공
 */
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({
      where: { senderId: req.params.sellerId, senderType: 'seller' },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: inquiries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries/seller-to-admin/{sellerId}:
 *   get:
 *     summary: 판매자→관리자 문의 조회
 *     tags: [Inquiries]
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
 *         description: 성공
 */
router.get('/seller-to-admin/:sellerId', async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({
      where: {
        senderId: req.params.sellerId,
        senderType: 'seller',
        receiverType: 'admin',
      },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: inquiries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/inquiries/{id}:
 *   delete:
 *     summary: 문의사항 삭제
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
router.delete('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: '문의사항을 찾을 수 없습니다.' });
    }

    await inquiry.destroy();
    res.json({ success: true, message: '문의사항이 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
