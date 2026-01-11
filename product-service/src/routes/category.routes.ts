import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     tags: [Categories]
 *     summary: 카테고리 목록 조회
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   get:
 *     tags: [Categories]
 *     summary: 카테고리 상세 조회
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:categoryId', categoryController.getCategoryById);

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     tags: [Categories]
 *     summary: 카테고리 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', categoryController.createCategory);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   put:
 *     tags: [Categories]
 *     summary: 카테고리 수정 (전체)
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *         description: Success
 */
router.put('/:categoryId', categoryController.updateCategory);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   patch:
 *     tags: [Categories]
 *     summary: 카테고리 수정 (부분)
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *         description: Success
 */
router.patch('/:categoryId', categoryController.updateCategory);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   delete:
 *     tags: [Categories]
 *     summary: 카테고리 삭제
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/:categoryId', categoryController.deleteCategory);

export default router;

