import { Router } from 'express';
import { analyticsController } from '@controllers/analytics.controller';

const router = Router();

router.post('/track', analyticsController.track.bind(analyticsController));
router.get('/events', analyticsController.getEvents.bind(analyticsController));
router.get('/user/:userId', analyticsController.getUserEvents.bind(analyticsController));
router.get('/count', analyticsController.getEventCount.bind(analyticsController));
router.get('/top-products', analyticsController.getTopProducts.bind(analyticsController));

export default router;
