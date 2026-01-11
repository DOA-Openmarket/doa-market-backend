import { Router } from 'express';
import { notificationController } from '@controllers/notification.controller';

const router = Router();
router.post('/', notificationController.create.bind(notificationController));
router.get('/user/:userId', notificationController.getByUser.bind(notificationController));
router.patch('/:notificationId/read', notificationController.markAsRead.bind(notificationController));

export default router;
