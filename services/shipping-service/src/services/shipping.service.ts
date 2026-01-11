import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { Shipping, ShippingStatus } from '@models/Shipping';

export class ShippingService {
  private repository: Repository<Shipping>;

  constructor() {
    this.repository = AppDataSource.getRepository(Shipping);
  }

  async createShipping(data: any): Promise<Shipping> {
    const trackingNumber = this.generateTrackingNumber();
    const shipping = this.repository.create({
      shippingId: uuidv4(),
      trackingNumber,
      ...data,
    });
    return await this.repository.save(shipping);
  }

  async getShipping(shippingId: string): Promise<Shipping | null> {
    return await this.repository.findOne({ where: { shippingId } });
  }

  async getShippingByOrder(orderId: string): Promise<Shipping | null> {
    return await this.repository.findOne({ where: { orderId } });
  }

  async trackShipping(trackingNumber: string): Promise<Shipping | null> {
    return await this.repository.findOne({ where: { trackingNumber } });
  }

  async updateStatus(shippingId: string, status: ShippingStatus, metadata?: any): Promise<Shipping> {
    const shipping = await this.repository.findOne({ where: { shippingId } });
    if (!shipping) throw new Error('Shipping not found');

    shipping.status = status;

    if (status === ShippingStatus.SHIPPED) {
      shipping.shippedAt = new Date();
    } else if (status === ShippingStatus.DELIVERED) {
      shipping.actualDelivery = new Date();
    }

    if (metadata) {
      shipping.metadata = { ...shipping.metadata, ...metadata };
    }

    return await this.repository.save(shipping);
  }

  async getUserShippings(userId: string): Promise<Shipping[]> {
    return await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private generateTrackingNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRK${timestamp}${random}`;
  }
}
