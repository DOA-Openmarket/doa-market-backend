import { Router } from 'express';
import sellerController from '../controllers/seller.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/sellers:
 *   get:
 *     tags: [Sellers]
 *     summary: 판매자 목록 조회
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected, suspended]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', sellerController.getAll);

/**
 * @swagger
 * /api/v1/sellers/stats:
 *   get:
 *     tags: [Sellers]
 *     summary: 판매자 통계 조회
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stats', sellerController.getStats);

/**
 * @swagger
 * /api/v1/sellers/{id}:
 *   get:
 *     tags: [Sellers]
 *     summary: 판매자 상세 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', sellerController.getById);

/**
 * @swagger
 * /api/v1/sellers/{id}/attachments:
 *   get:
 *     tags: [Sellers]
 *     summary: 판매자 첨부파일 목록 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id/attachments', sellerController.getAttachments);

/**
 * @swagger
 * /api/v1/sellers:
 *   post:
 *     tags: [Sellers]
 *     summary: 판매자 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storeName
 *               - businessNumber
 *             properties:
 *               userId:
 *                 type: string
 *               storeName:
 *                 type: string
 *               businessNumber:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', sellerController.create);

/**
 * @swagger
 * /api/v1/sellers/{id}:
 *   put:
 *     tags: [Sellers]
 *     summary: 판매자 수정
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
 *               storeName:
 *                 type: string
 *               businessNumber:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/:id', sellerController.update);

/**
 * @swagger
 * /api/v1/sellers/{id}:
 *   delete:
 *     tags: [Sellers]
 *     summary: 판매자 삭제
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/:id', sellerController.delete);

/**
 * @swagger
 * /api/v1/sellers/{id}/verify:
 *   patch:
 *     tags: [Sellers]
 *     summary: 판매자 검증
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.patch('/:id/verify', sellerController.verify);

export default router;

