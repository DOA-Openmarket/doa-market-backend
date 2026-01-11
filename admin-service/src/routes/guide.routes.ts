import { Router } from 'express';
import Guide from '../models/guide.model';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/guides:
 *   get:
 *     summary: 가이드 목록 조회
 *     tags: [Guides]
 *     parameters:
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
    const { type, category } = req.query;
    const where: any = { isActive: true };

    if (type) where.type = type;
    if (category) where.category = category;

    const guides = await Guide.findAll({
      where,
      order: [
        ['displayOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
    });

    res.json({ success: true, data: guides });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/guides/{id}:
 *   get:
 *     summary: 가이드 상세 조회
 *     tags: [Guides]
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
    const guide = await Guide.findByPk(req.params.id);
    if (!guide) {
      return res.status(404).json({ success: false, message: '가이드를 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: guide });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/guides/{guideId}/attachments:
 *   get:
 *     summary: 가이드 첨부파일 목록
 *     tags: [Guides]
 *     parameters:
 *       - in: path
 *         name: guideId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/:guideId/attachments', async (req, res) => {
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
 * /api/v1/admin/guides:
 *   post:
 *     summary: 가이드 생성
 *     tags: [Guides]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *               category:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 생성 성공
 */
router.post('/', async (req, res) => {
  try {
    const guide = await Guide.create(req.body);
    res.status(201).json({ success: true, data: guide });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/guides/{id}:
 *   put:
 *     summary: 가이드 수정
 *     tags: [Guides]
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
    const guide = await Guide.findByPk(req.params.id);
    if (!guide) {
      return res.status(404).json({ success: false, message: '가이드를 찾을 수 없습니다.' });
    }

    await guide.update(req.body);
    res.json({ success: true, data: guide });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/guides/{id}:
 *   delete:
 *     summary: 가이드 삭제
 *     tags: [Guides]
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
    const guide = await Guide.findByPk(req.params.id);
    if (!guide) {
      return res.status(404).json({ success: false, message: '가이드를 찾을 수 없습니다.' });
    }

    await guide.destroy();
    res.json({ success: true, message: '가이드가 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
