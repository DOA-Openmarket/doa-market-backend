import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  getWishlistCount,
} from '../controllers/wishlist.controller';

const router = Router();

// GET /api/v1/wishlist/user/:userId - Get user's wishlist
router.get('/user/:userId', getWishlist);

// POST /api/v1/wishlist - Add to wishlist
router.post('/', addToWishlist);

// DELETE /api/v1/wishlist/:userId/:productId - Remove from wishlist
router.delete('/:userId/:productId', removeFromWishlist);

// GET /api/v1/wishlist/check/:userId/:productId - Check if in wishlist
router.get('/check/:userId/:productId', checkWishlist);

// GET /api/v1/wishlist/count/:userId - Get wishlist count
router.get('/count/:userId', getWishlistCount);

export default router;
