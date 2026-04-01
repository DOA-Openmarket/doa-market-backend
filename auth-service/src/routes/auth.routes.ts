import { Router } from 'express';
import authController from '../controllers/auth.controller';
import naverOAuthController from '../controllers/naver-oauth.controller';
import kakaoOAuthController from '../controllers/kakao-oauth.controller';
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
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: 회원가입
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 이미 존재하는 이메일
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authLimiter, authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authLimiter, authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: 토큰 갱신
 *     description: Refresh Token으로 새로운 Access Token을 발급받습니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: 유효하지 않은 토큰
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: 로그아웃
 *     description: 사용자를 로그아웃하고 Refresh Token을 무효화합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 현재 사용자 정보 조회
 *     description: JWT 토큰으로 현재 로그인한 사용자 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /api/v1/auth/send-verification:
 *   post:
 *     tags: [Auth]
 *     summary: 이메일 인증 코드 발송
 *     description: 이메일 주소로 인증 코드를 발송합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: 인증 코드 발송 성공
 *       400:
 *         description: 잘못된 요청
 */
router.post('/send-verification', authLimiter, authController.sendVerification);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: 이메일 인증 코드 검증
 *     description: 발송된 인증 코드를 검증합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: 인증 성공
 *       400:
 *         description: 잘못된 코드 또는 만료됨
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: 비밀번호 재설정
 *     description: 인증 코드를 사용하여 비밀번호를 재설정합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 *       400:
 *         description: 잘못된 코드 또는 만료됨
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/naver:
 *   get:
 *     tags: [Auth]
 *     summary: 네이버 OAuth 인증 URL 가져오기
 *     description: 네이버 로그인을 위한 OAuth 인증 URL을 반환합니다.
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF 방지를 위한 state 값 (선택사항)
 *     responses:
 *       200:
 *         description: 인증 URL 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 */
router.get('/naver', naverOAuthController.getAuthUrl);

/**
 * @swagger
 * /api/v1/auth/naver/callback:
 *   get:
 *     tags: [Auth]
 *     summary: 네이버 OAuth 콜백 처리
 *     description: 네이버 로그인 후 콜백을 처리합니다.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State 값
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.get('/naver/callback', naverOAuthController.handleCallback);

/**
 * @swagger
 * /api/v1/auth/naver/login:
 *   post:
 *     tags: [Auth]
 *     summary: 네이버 OAuth 로그인 (모바일용)
 *     description: 모바일 앱에서 직접 네이버 authorization code로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - state
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code
 *               state:
 *                 type: string
 *                 description: State 값
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/naver/login', naverOAuthController.login);

/**
 * @swagger
 * /api/v1/auth/kakao:
 *   get:
 *     tags: [Auth]
 *     summary: 카카오 OAuth 인증 URL 가져오기
 *     description: 카카오 로그인을 위한 OAuth 인증 URL을 반환합니다.
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF 방지를 위한 state 값 (선택사항)
 *     responses:
 *       200:
 *         description: 인증 URL 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 */
router.get('/kakao', kakaoOAuthController.getAuthUrl);

/**
 * @swagger
 * /api/v1/auth/kakao/callback:
 *   get:
 *     tags: [Auth]
 *     summary: 카카오 OAuth 콜백 처리
 *     description: 카카오 로그인 후 콜백을 처리합니다.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State 값
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.get('/kakao/callback', kakaoOAuthController.handleCallback);

/**
 * @swagger
 * /api/v1/auth/kakao/login:
 *   post:
 *     tags: [Auth]
 *     summary: 카카오 OAuth 로그인 (모바일용)
 *     description: 모바일 앱에서 직접 카카오 authorization code로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - state
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code
 *               state:
 *                 type: string
 *                 description: State 값
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/kakao/login', kakaoOAuthController.login);

export default router;

