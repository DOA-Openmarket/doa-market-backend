import { Router } from 'express';
import { shippingController } from '@controllers/shipping.controller';

const router = Router();

router.post('/', shippingController.create.bind(shippingController));
router.get('/:shippingId', shippingController.getById.bind(shippingController));
router.get('/track/:trackingNumber', shippingController.track.bind(shippingController));
router.patch('/:shippingId/status', shippingController.updateStatus.bind(shippingController));
router.get('/user/:userId', shippingController.getUserShippings.bind(shippingController));

export default router;
