import { Router } from 'express';
import Banner from '../models/banner.model';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/banners:
 *   get:
 *     summary: 배너 목록 조회
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: ownerType
 *         schema:
 *           type: string
 *           enum: [ADVERTISER, PARTNER]
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/', async (req, res) => {
  try {
    const { ownerType } = req.query;
    const where: any = { isActive: true };
    
    if (ownerType) {
      where.ownerType = ownerType;
    }

    const banners = await Banner.findAll({
      where,
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: banners,
    });
  } catch (error: any) {
    logger.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/banners/{id}:
 *   get:
 *     summary: 배너 상세 조회
 *     tags: [Banners]
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
    const banner = await Banner.findByPk(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: banner,
    });
  } catch (error: any) {
    logger.error('Error fetching banner:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/banners:
 *   post:
 *     summary: 배너 생성
 *     tags: [Banners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *               - ownerType
 *             properties:
 *               title:
 *                 type: string
 *               link:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               ownerType:
 *                 type: string
 *                 enum: [ADVERTISER, PARTNER]
 *               ownerId:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 생성 성공
 */
router.post('/', async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    
    res.status(201).json({
      success: true,
      data: banner,
    });
  } catch (error: any) {
    logger.error('Error creating banner:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/banners/{id}:
 *   put:
 *     summary: 배너 수정
 *     tags: [Banners]
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
    const banner = await Banner.findByPk(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    await banner.update(req.body);
    
    res.json({
      success: true,
      data: banner,
    });
  } catch (error: any) {
    logger.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/banners/{id}:
 *   delete:
 *     summary: 배너 삭제
 *     tags: [Banners]
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
    const banner = await Banner.findByPk(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    await banner.destroy();
    
    res.json({
      success: true,
      message: '배너가 삭제되었습니다.',
    });
  } catch (error: any) {
    logger.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;

