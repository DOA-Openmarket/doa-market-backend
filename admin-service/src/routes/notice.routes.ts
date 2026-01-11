import { Router } from 'express';
import Notice from '../models/notice.model';
import { Op } from 'sequelize';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/notices:
 *   get:
 *     summary: 공지사항 목록 조회
 *     tags: [Notices]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 카테고리 필터
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 상태 필터
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

    const { count, rows } = await Notice.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['isPinned', 'DESC'],
        ['priority', 'DESC'], // urgent first
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
 * /api/v1/admin/notices/type/{type}:
 *   get:
 *     summary: 타입별 공지사항 조회
 *     tags: [Notices]
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
    const notices = await Notice.findAll({
      where: { type: req.params.type },
      order: [
        ['isPinned', 'DESC'],
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
    });

    res.json({ success: true, data: notices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/notices/{id}:
 *   get:
 *     summary: 공지사항 상세 조회
 *     tags: [Notices]
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
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
    }

    // 조회수 증가
    await notice.increment('views');

    res.json({ success: true, data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/notices/{id}/attachments:
 *   get:
 *     summary: 공지사항 첨부파일 목록
 *     tags: [Notices]
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
 * /api/v1/admin/notices:
 *   post:
 *     summary: 공지사항 생성
 *     tags: [Notices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - createdBy
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: 생성 성공
 */
router.post('/', async (req, res) => {
  try {
    const notice = await Notice.create(req.body);
    res.status(201).json({ success: true, data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/notices/{id}:
 *   put:
 *     summary: 공지사항 수정
 *     tags: [Notices]
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
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
    }

    await notice.update(req.body);
    res.json({ success: true, data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/notices/{id}:
 *   delete:
 *     summary: 공지사항 삭제
 *     tags: [Notices]
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
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
    }

    await notice.destroy();
    res.json({ success: true, message: '공지사항이 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
