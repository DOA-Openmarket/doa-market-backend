import { Router } from 'express';
import { cartController } from '@controllers/cart.controller';

const router = Router();

router.get('/:userId', cartController.getCart.bind(cartController));
router.post('/:userId/items', cartController.addItem.bind(cartController));
router.put('/:userId/items/:productId', cartController.updateItem.bind(cartController));
router.delete('/:userId/items/:productId', cartController.removeItem.bind(cartController));
router.delete('/:userId', cartController.clearCart.bind(cartController));

export default router;
