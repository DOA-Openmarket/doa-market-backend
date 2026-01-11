import { Router } from 'express';
import sellerAuthController from '../controllers/seller-auth.controller';
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
 * /api/v1/sellers/sign-up:
 *   post:
 *     tags: [Seller Auth]
 *     summary: 판매자 회원가입
 *     description: 새로운 판매자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - storeName
 *               - businessNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               storeName:
 *                 type: string
 *               businessNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: 판매자 회원가입 성공
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이미 존재하는 이메일 또는 사업자번호
 */
router.post('/sign-up', authLimiter, sellerAuthController.signUp);

/**
 * @swagger
 * /api/v1/sellers/sign-in:
 *   post:
 *     tags: [Seller Auth]
 *     summary: 판매자 로그인
 *     description: 이메일과 비밀번호로 판매자 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/sign-in', authLimiter, sellerAuthController.signIn);

/**
 * @swagger
 * /api/v1/sellers/me:
 *   get:
 *     tags: [Seller Auth]
 *     summary: 현재 판매자 정보 조회
 *     description: JWT 토큰으로 현재 로그인한 판매자 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 판매자 정보 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 판매자 권한 필요
 */
router.get('/me', authenticate, sellerAuthController.getMe);

export default router;
