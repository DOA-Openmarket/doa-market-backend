import { Router } from 'express';
import inquiryController from '../controllers/inquiry.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/users/{userId}/inquiries:
 *   get:
 *     tags: [Inquiries]
 *     summary: 문의 목록 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, answered]
 *     responses:
 *       200:
 *         description: 문의 목록 조회 성공
 */
router.get('/:userId/inquiries', inquiryController.getInquiries);

/**
 * @swagger
 * /api/v1/users/{userId}/inquiries/{inquiryId}:
 *   get:
 *     tags: [Inquiries]
 *     summary: 문의 상세 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 문의 상세 조회 성공
 */
router.get('/:userId/inquiries/:inquiryId', inquiryController.getInquiry);

/**
 * @swagger
 * /api/v1/users/{userId}/inquiries:
 *   post:
 *     tags: [Inquiries]
 *     summary: 문의 작성
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *               content:
 *                 type: string
 *                 minLength: 20
 *               category:
 *                 type: string
 *                 enum: [order, product, delivery, payment, etc]
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 문의 작성 성공
 */
router.post('/:userId/inquiries', inquiryController.createInquiry);

export default router;
