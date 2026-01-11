import { Router } from 'express';
import axios from 'axios';

const router = Router();
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://admin-service:3014';

/**
 * @swagger
 * /api/v1/notices:
 *   get:
 *     summary: 공지사항 목록 조회 (사용자용)
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
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [normal, urgent]
 *         description: 우선순위 필터
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, priority } = req.query;

    // 관리자 서비스에서 발행된 공지사항만 조회
    const params: any = {
      page,
      limit,
      status: 'published', // 발행된 공지만
    };

    if (category) params.category = category;
    if (priority) params.priority = priority;

    const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/notices`, {
      params,
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Notice fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: '공지사항을 불러오는데 실패했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/v1/notices/{id}:
 *   get:
 *     summary: 공지사항 상세 조회 (사용자용)
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
 *       404:
 *         description: 공지사항을 찾을 수 없습니다
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/notices/${id}`);

    // 발행된 공지만 보여주기
    if (response.data.data.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: '공지사항을 찾을 수 없습니다.'
      });
    }

    res.json(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: '공지사항을 찾을 수 없습니다.'
      });
    }

    console.error('Notice detail fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: '공지사항을 불러오는데 실패했습니다.'
    });
  }
});

export default router;
