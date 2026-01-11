import { Router } from 'express';
import { wishlistController } from '@controllers/wishlist.controller';

const router = Router();

router.post('/', wishlistController.add.bind(wishlistController));
router.delete('/:userId/:productId', wishlistController.remove.bind(wishlistController));
router.get('/user/:userId', wishlistController.getUserWishlist.bind(wishlistController));
router.get('/check/:userId/:productId', wishlistController.checkInWishlist.bind(wishlistController));
router.get('/count/:userId', wishlistController.getCount.bind(wishlistController));

export default router;
