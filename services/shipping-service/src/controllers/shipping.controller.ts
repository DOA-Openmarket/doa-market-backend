import { Request, Response } from 'express';
import { ShippingService } from '@services/shipping.service';

const shippingService = new ShippingService();

export class ShippingController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const shipping = await shippingService.createShipping(req.body);
      res.status(201).json({ success: true, data: shipping });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const shipping = await shippingService.getShipping(req.params.shippingId);
      if (!shipping) {
        res.status(404).json({ success: false, error: 'Shipping not found' });
        return;
      }
      res.json({ success: true, data: shipping });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async track(req: Request, res: Response): Promise<void> {
    try {
      const { trackingNumber } = req.params;
      const shipping = await shippingService.trackShipping(trackingNumber);
      if (!shipping) {
        res.status(404).json({ success: false, error: 'Tracking number not found' });
        return;
      }
      res.json({ success: true, data: shipping });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { shippingId } = req.params;
      const { status, metadata } = req.body;
      const shipping = await shippingService.updateStatus(shippingId, status, metadata);
      res.json({ success: true, data: shipping });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getUserShippings(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const shippings = await shippingService.getUserShippings(userId);
      res.json({ success: true, data: shippings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const shippingController = new ShippingController();
