import { Router } from 'express';
import Policy from '../models/policy.model';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/policies:
 *   get:
 *     summary: 정책 목록 조회
 *     tags: [Policies]
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
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
    const type = req.query.type as string;
    const status = req.query.status as string;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const { count, rows } = await Policy.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['effectiveDate', 'DESC'],
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
 * /api/v1/admin/policies/{id}:
 *   get:
 *     summary: 정책 상세 조회
 *     tags: [Policies]
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
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, message: '정책을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/policies/type/{type}/active:
 *   get:
 *     summary: 특정 유형의 현재 활성 정책 조회
 *     tags: [Policies]
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
router.get('/type/:type/active', async (req, res) => {
  try {
    const policy = await Policy.findOne({
      where: {
        type: req.params.type,
        status: 'active'
      },
      order: [['effectiveDate', 'DESC']],
    });

    if (!policy) {
      return res.status(404).json({ success: false, message: '활성 정책을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/policies:
 *   post:
 *     summary: 정책 생성
 *     tags: [Policies]
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
    const policy = await Policy.create(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/policies/{id}:
 *   put:
 *     summary: 정책 수정
 *     tags: [Policies]
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
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, message: '정책을 찾을 수 없습니다.' });
    }

    await policy.update(req.body);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/policies/{id}/activate:
 *   post:
 *     summary: 정책 활성화
 *     tags: [Policies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 활성화 성공
 */
router.post('/:id/activate', async (req, res) => {
  try {
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, message: '정책을 찾을 수 없습니다.' });
    }

    // 같은 타입의 다른 활성 정책들을 archived로 변경
    await Policy.update(
      { status: 'archived' },
      {
        where: {
          type: policy.type,
          status: 'active',
          id: { [require('sequelize').Op.ne]: policy.id }
        }
      }
    );

    await policy.update({ status: 'active' });
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/admin/policies/{id}:
 *   delete:
 *     summary: 정책 삭제
 *     tags: [Policies]
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
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, message: '정책을 찾을 수 없습니다.' });
    }

    await policy.destroy();
    res.json({ success: true, message: '정책이 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
