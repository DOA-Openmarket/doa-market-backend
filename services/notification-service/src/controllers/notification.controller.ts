import { Request, Response } from 'express';
import { NotificationService } from '@services/notification.service';

const service = new NotificationService();

export class NotificationController {
  async create(req: Request, res: Response) {
    try {
      const notification = await service.create(req.body);
      res.status(201).json({ success: true, data: notification });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getByUser(req: Request, res: Response) {
    try {
      const notifications = await service.getByUser(req.params.userId);
      res.json({ success: true, data: notifications });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      await service.markAsRead(req.params.notificationId);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const notificationController = new NotificationController();
