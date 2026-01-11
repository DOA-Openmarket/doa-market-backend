import { Router } from 'express';
import ErrorReport from '../models/error-report.model';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/errorReport:
 *   get:
 *     summary: 오류 제보 목록 조회
 *     tags: [ErrorReport]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/', async (req, res) => {
  try {
    const { status, type, category } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (category) where.category = category;

    const reports = await ErrorReport.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/{id}:
 *   get:
 *     summary: 오류 제보 상세 조회
 *     tags: [ErrorReport]
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
    const report = await ErrorReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: '오류 제보를 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport:
 *   post:
 *     summary: 오류 제보 생성
 *     tags: [ErrorReport]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reporterId
 *               - reporterType
 *               - category
 *               - title
 *               - content
 *             properties:
 *               reporterId:
 *                 type: string
 *               reporterType:
 *                 type: string
 *               category:
 *                 type: string
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: 생성 성공
 */
router.post('/', async (req, res) => {
  try {
    const report = await ErrorReport.create(req.body);
    res.status(201).json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/{id}:
 *   put:
 *     summary: 오류 제보 수정
 *     tags: [ErrorReport]
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
    const report = await ErrorReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: '오류 제보를 찾을 수 없습니다.' });
    }

    await report.update(req.body);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/{id}:
 *   delete:
 *     summary: 오류 제보 삭제
 *     tags: [ErrorReport]
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
    const report = await ErrorReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: '오류 제보를 찾을 수 없습니다.' });
    }

    await report.destroy();
    res.json({ success: true, message: '오류 제보가 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/status/{status}:
 *   get:
 *     summary: 상태별 오류 제보 조회
 *     tags: [ErrorReport]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/status/:status', async (req, res) => {
  try {
    const reports = await ErrorReport.findAll({
      where: { status: req.params.status },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/category/{category}:
 *   get:
 *     summary: 카테고리별 오류 제보 조회
 *     tags: [ErrorReport]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/category/:category', async (req, res) => {
  try {
    const reports = await ErrorReport.findAll({
      where: { category: req.params.category },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/type/{type}:
 *   get:
 *     summary: 타입별 오류 제보 조회
 *     tags: [ErrorReport]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/type/:type', async (req, res) => {
  try {
    const reports = await ErrorReport.findAll({
      where: { type: req.params.type },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/seller/{sellerId}/{type}:
 *   get:
 *     summary: 판매자별 오류 제보 조회
 *     tags: [ErrorReport]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/seller/:sellerId/:type', async (req, res) => {
  try {
    const { sellerId, type } = req.params;
    const reports = await ErrorReport.findAll({
      where: {
        reporterId: sellerId,
        reporterType: 'SELLER',
        type,
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/{id}/answer:
 *   post:
 *     summary: 오류 제보 답변 등록
 *     tags: [ErrorReport]
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
 *             required:
 *               - answer
 *             properties:
 *               answer:
 *                 type: string
 *               answeredBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: 답변 등록 성공
 */
router.post('/:id/answer', async (req, res) => {
  try {
    const report = await ErrorReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: '오류 제보를 찾을 수 없습니다.' });
    }

    await report.update({
      answer: req.body.answer,
      answeredBy: req.body.answeredBy,
      answeredAt: new Date(),
      status: 'RESOLVED',
    });

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/errorReport/{id}/attachments:
 *   get:
 *     summary: 오류 제보 첨부파일 목록
 *     tags: [ErrorReport]
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

export default router;
