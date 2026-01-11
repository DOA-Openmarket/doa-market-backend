import { Router } from 'express';
import { reviewController } from '@controllers/review.controller';

const router = Router();
router.post('/', reviewController.create.bind(reviewController));
router.get('/product/:productId', reviewController.getByProduct.bind(reviewController));

export default router;
