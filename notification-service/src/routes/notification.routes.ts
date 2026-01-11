import { Router } from 'express';
import Notification from '../models/notification.model';

const router = Router();

router.get('/', async (req, res) => {
  const notifications = await Notification.findAll();
  res.json({ success: true, data: notifications });
});

router.post('/', async (req, res) => {
  const notification = await Notification.create(req.body);
  res.json({ success: true, data: notification });
});

router.post('/:id/send', async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (notification) {
    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();
  }
  res.json({ success: true, data: notification });
});

export default router;

