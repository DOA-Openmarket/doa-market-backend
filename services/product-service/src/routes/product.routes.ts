import { Router } from 'express';
import { productController } from '@controllers/ProductController';
import { authenticate, authorize, checkSellerOwnership } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validation.middleware';
import { createProductSchema, updateProductSchema, productQuerySchema } from '@dto/product.dto';

const router = Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filtering and pagination
 * @access  Public
 */
router.get('/', validate(productQuerySchema, 'query'), productController.getProducts);

/**
 * @route   GET /api/v1/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', validate(productQuerySchema, 'query'), productController.searchProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   GET /api/v1/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/slug/:slug', productController.getProductBySlug);

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Private (Admin, Seller)
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'seller'),
  validate(createProductSchema, 'body'),
  productController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (Admin, Seller - own products only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'seller'),
  checkSellerOwnership,
  validate(updateProductSchema, 'body'),
  productController.updateProduct
);

/**
 * @route   PATCH /api/v1/products/:id/status
 * @desc    Update product status
 * @access  Private (Admin, Seller - own products only)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'seller'),
  checkSellerOwnership,
  productController.updateProductStatus
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (Admin, Seller - own products only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'seller'),
  checkSellerOwnership,
  productController.deleteProduct
);

export default router;
