import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { Coupon, CouponStatus, DiscountType } from '@models/Coupon';

export class CouponService {
  private repository: Repository<Coupon>;

  constructor() {
    this.repository = AppDataSource.getRepository(Coupon);
  }

  async createCoupon(data: any): Promise<Coupon> {
    const coupon = this.repository.create({
      couponId: uuidv4(),
      ...data,
    });
    return await this.repository.save(coupon);
  }

  async getCoupon(couponId: string): Promise<Coupon | null> {
    return await this.repository.findOne({ where: { couponId } });
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    return await this.repository.findOne({ where: { code } });
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return await this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async validateCoupon(code: string, purchaseAmount: number, userId?: string): Promise<{ valid: boolean; message?: string; coupon?: Coupon }> {
    const coupon = await this.getCouponByCode(code);
    
    if (!coupon) {
      return { valid: false, message: 'Coupon not found' };
    }

    if (coupon.status !== CouponStatus.ACTIVE) {
      return { valid: false, message: 'Coupon is not active' };
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return { valid: false, message: 'Coupon is not yet valid' };
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return { valid: false, message: 'Coupon has expired' };
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    if (coupon.minPurchaseAmount !== null && purchaseAmount < Number(coupon.minPurchaseAmount)) {
      return { valid: false, message: `Minimum purchase amount is ${coupon.minPurchaseAmount}` };
    }

    return { valid: true, coupon };
  }

  async applyCoupon(code: string, purchaseAmount: number): Promise<{ discountAmount: number; finalAmount: number; coupon: Coupon }> {
    const validation = await this.validateCoupon(code, purchaseAmount);
    
    if (!validation.valid || !validation.coupon) {
      throw new Error(validation.message || 'Invalid coupon');
    }

    const coupon = validation.coupon;
    let discountAmount = 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (purchaseAmount * Number(coupon.discountValue)) / 100;
    } else if (coupon.discountType === DiscountType.FIXED) {
      discountAmount = Number(coupon.discountValue);
    }

    if (coupon.maxDiscountAmount !== null && discountAmount > Number(coupon.maxDiscountAmount)) {
      discountAmount = Number(coupon.maxDiscountAmount);
    }

    discountAmount = Math.min(discountAmount, purchaseAmount);
    const finalAmount = purchaseAmount - discountAmount;

    coupon.usageCount += 1;
    await this.repository.save(coupon);

    return {
      discountAmount: Number(discountAmount.toFixed(2)),
      finalAmount: Number(finalAmount.toFixed(2)),
      coupon,
    };
  }

  async updateCoupon(couponId: string, data: Partial<Coupon>): Promise<Coupon> {
    const coupon = await this.getCoupon(couponId);
    if (!coupon) throw new Error('Coupon not found');

    Object.assign(coupon, data);
    return await this.repository.save(coupon);
  }

  async deleteCoupon(couponId: string): Promise<void> {
    await this.repository.delete(couponId);
  }
}
