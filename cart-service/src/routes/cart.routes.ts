import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';

const router = Router();

/**
 * @route   GET /api/v1/cart
 * @desc    Get user's shopping cart
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/v1/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/', cartController.addToCart);

/**
 * @route   PATCH /api/v1/cart/:cartItemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.patch('/:cartItemId', cartController.updateCartItem);

/**
 * @route   DELETE /api/v1/cart/:cartItemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/:cartItemId', cartController.removeFromCart);

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear all items from cart
 * @access  Private
 */
router.delete('/', cartController.clearCart);

export default router;
