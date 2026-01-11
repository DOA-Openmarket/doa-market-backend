import { Request, Response } from 'express';
import { AdminService } from '@services/admin.service';
import { AdminActionType } from '@models/AdminLog';

const adminService = new AdminService();

export class AdminController {
  async logAction(req: Request, res: Response): Promise<void> {
    try {
      const log = await adminService.logAction(req.body);
      res.status(201).json({ success: true, data: log });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { adminId, actionType, limit } = req.query;
      const logs = await adminService.getAdminLogs(
        adminId as string,
        actionType as AdminActionType,
        limit ? parseInt(limit as string) : undefined
      );
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await adminService.getSystemStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const adminController = new AdminController();
