import { Router } from 'express';
import adminAuthController from '../controllers/admin-auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
  message: 'Too many requests from this IP, please try again later',
});

/**
 * @swagger
 * /api/v1/admin/sign-in:
 *   post:
 *     tags: [Admin Auth]
 *     summary: 관리자 로그인
 *     description: 관리자 ID와 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - adminPw
 *             properties:
 *               adminId:
 *                 type: string
 *               adminPw:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/sign-in', authLimiter, adminAuthController.signIn);

/**
 * @swagger
 * /api/v1/admin/me:
 *   get:
 *     tags: [Admin Auth]
 *     summary: 현재 관리자 정보 조회
 *     description: JWT 토큰으로 현재 로그인한 관리자 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 관리자 정보 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 관리자 권한 필요
 */
router.get('/me', authenticate, adminAuthController.getMe);

export default router;
