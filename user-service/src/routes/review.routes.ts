import { Router } from 'express';
import reviewController from '../controllers/review.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/users/{userId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: 내 리뷰 목록 조회
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
 *     responses:
 *       200:
 *         description: 내 리뷰 목록 조회 성공
 */
router.get('/:userId/reviews', reviewController.getMyReviews);

/**
 * @swagger
 * /api/v1/users/{userId}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: 리뷰 작성
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
 *               - productId
 *               - orderId
 *               - rating
 *               - content
 *             properties:
 *               productId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               content:
 *                 type: string
 *                 minLength: 10
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 리뷰 작성 성공
 */
router.post('/:userId/reviews', reviewController.createReview);

/**
 * @swagger
 * /api/v1/users/{userId}/reviews/{reviewId}:
 *   put:
 *     tags: [Reviews]
 *     summary: 리뷰 수정
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - content
 *             properties:
 *               rating:
 *                 type: integer
 *               content:
 *                 type: string
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 리뷰 수정 성공
 */
router.put('/:userId/reviews/:reviewId', reviewController.updateReview);

/**
 * @swagger
 * /api/v1/users/{userId}/reviews/{reviewId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: 리뷰 삭제
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 리뷰 삭제 성공
 */
router.delete('/:userId/reviews/:reviewId', reviewController.deleteReview);

export default router;
