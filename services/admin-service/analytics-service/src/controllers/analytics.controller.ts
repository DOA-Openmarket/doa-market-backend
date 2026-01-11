import { Request, Response } from 'express';
import { AnalyticsService } from '@services/analytics.service';
import { AnalyticsEventType } from '@models/Analytics';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async track(req: Request, res: Response): Promise<void> {
    try {
      const event = await analyticsService.trackEvent(req.body);
      res.status(201).json({ success: true, data: event });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, startDate, endDate } = req.query;
      const events = await analyticsService.getEventsByType(
        eventType as AnalyticsEventType,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserEvents(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const events = await analyticsService.getUserEvents(userId);
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getEventCount(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, startDate, endDate } = req.query;
      const count = await analyticsService.getEventCount(
        eventType as AnalyticsEventType,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ success: true, data: { count } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getTopProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topProducts = await analyticsService.getTopProducts(limit);
      res.json({ success: true, data: topProducts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const analyticsController = new AnalyticsController();
