import { Request, Response } from 'express';
import { CouponService } from '@services/coupon.service';

const couponService = new CouponService();

export class CouponController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Transform frontend data to backend format
      const frontendData = req.body;

      // Generate unique coupon code if not provided
      const generateCode = () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `COUPON-${timestamp}-${random}`.toUpperCase();
      };

      // Map discount_mode to discountType
      const discountTypeMap: { [key: string]: string } = {
        'amount': 'fixed',
        'percent': 'percentage',
        'percentage': 'percentage',
        'fixed': 'fixed'
      };

      const backendData = {
        code: frontendData.code || generateCode(),
        name: frontendData.title || frontendData.name || 'Unnamed Coupon',
        description: frontendData.content || frontendData.description || null,
        discountType: discountTypeMap[frontendData.discount_mode] || frontendData.discountType || 'fixed',
        discountValue: Number(frontendData.discount_amount || frontendData.discountValue || 0),
        minPurchaseAmount: frontendData.min_order_amount ? Number(frontendData.min_order_amount) : null,
        maxDiscountAmount: frontendData.discount_max ? Number(frontendData.discount_max) : null,
        usageLimit: frontendData.total_count ? Number(frontendData.total_count) : null,
        startsAt: frontendData.start_date || frontendData.valid_from || frontendData.startsAt || null,
        expiresAt: frontendData.end_date || frontendData.valid_to || frontendData.expiresAt || null,
        status: 'active',
        metadata: {
          coupon_type: frontendData.coupon_type,
          issued_by: frontendData.issued_by,
          validity_type: frontendData.validity_type,
          validity_days: frontendData.validity_days,
        }
      };

      const coupon = await couponService.createCoupon(backendData);
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
      // Transform frontend data to backend format
      const frontendData = req.body;

      // Map discount_mode to discountType
      const discountTypeMap: { [key: string]: string } = {
        'amount': 'fixed',
        'percent': 'percentage',
        'percentage': 'percentage',
        'fixed': 'fixed'
      };

      const backendData: any = {};

      if (frontendData.title || frontendData.name) {
        backendData.name = frontendData.title || frontendData.name;
      }
      if (frontendData.content !== undefined || frontendData.description !== undefined) {
        backendData.description = frontendData.content || frontendData.description;
      }
      if (frontendData.discount_mode || frontendData.discountType) {
        backendData.discountType = discountTypeMap[frontendData.discount_mode] || frontendData.discountType;
      }
      if (frontendData.discount_amount !== undefined || frontendData.discountValue !== undefined) {
        backendData.discountValue = Number(frontendData.discount_amount || frontendData.discountValue);
      }
      if (frontendData.min_order_amount !== undefined || frontendData.minPurchaseAmount !== undefined) {
        backendData.minPurchaseAmount = frontendData.min_order_amount ? Number(frontendData.min_order_amount) : null;
      }
      if (frontendData.discount_max !== undefined || frontendData.maxDiscountAmount !== undefined) {
        backendData.maxDiscountAmount = frontendData.discount_max ? Number(frontendData.discount_max) : null;
      }
      if (frontendData.total_count !== undefined || frontendData.usageLimit !== undefined) {
        backendData.usageLimit = frontendData.total_count ? Number(frontendData.total_count) : null;
      }
      if (frontendData.start_date || frontendData.valid_from || frontendData.startsAt) {
        backendData.startsAt = frontendData.start_date || frontendData.valid_from || frontendData.startsAt;
      }
      if (frontendData.end_date || frontendData.valid_to || frontendData.expiresAt) {
        backendData.expiresAt = frontendData.end_date || frontendData.valid_to || frontendData.expiresAt;
      }

      // Update metadata
      if (frontendData.coupon_type || frontendData.issued_by || frontendData.validity_type || frontendData.validity_days) {
        backendData.metadata = {
          coupon_type: frontendData.coupon_type,
          issued_by: frontendData.issued_by,
          validity_type: frontendData.validity_type,
          validity_days: frontendData.validity_days,
        };
      }

      const coupon = await couponService.updateCoupon(req.params.couponId, backendData);
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
