import { Router } from 'express';
import { couponController } from '@controllers/coupon.controller';

const router = Router();

router.post('/', couponController.create.bind(couponController));
router.get('/', couponController.getAll.bind(couponController));
router.get('/:couponId', couponController.getById.bind(couponController));
router.get('/code/:code', couponController.getByCode.bind(couponController));
router.post('/validate', couponController.validate.bind(couponController));
router.post('/apply', couponController.apply.bind(couponController));
router.patch('/:couponId', couponController.update.bind(couponController));
router.delete('/:couponId', couponController.delete.bind(couponController));

export default router;
