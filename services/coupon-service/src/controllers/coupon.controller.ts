import { Request, Response } from 'express';
import { CouponService } from '@services/coupon.service';

const couponService = new CouponService();

export class CouponController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const coupon = await couponService.createCoupon(req.body);
      res.status(201).json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const coupon = await couponService.getCoupon(req.params.couponId);
      if (!coupon) {
        res.status(404).json({ success: false, error: 'Coupon not found' });
        return;
      }
      res.json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const coupon = await couponService.getCouponByCode(req.params.code);
      if (!coupon) {
        res.status(404).json({ success: false, error: 'Coupon not found' });
        return;
      }
      res.json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const coupons = await couponService.getAllCoupons();
      res.json({ success: true, data: coupons });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async validate(req: Request, res: Response): Promise<void> {
    try {
      const { code, purchaseAmount, userId } = req.body;
      const result = await couponService.validateCoupon(code, purchaseAmount, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async apply(req: Request, res: Response): Promise<void> {
    try {
      const { code, purchaseAmount } = req.body;
      const result = await couponService.applyCoupon(code, purchaseAmount);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const coupon = await couponService.updateCoupon(req.params.couponId, req.body);
      res.json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await couponService.deleteCoupon(req.params.couponId);
      res.json({ success: true, message: 'Coupon deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const couponController = new CouponController();
