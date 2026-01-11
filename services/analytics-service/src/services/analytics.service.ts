import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { AnalyticsEvent, AnalyticsEventType } from '@models/Analytics';

export class AnalyticsService {
  private repository: Repository<AnalyticsEvent>;

  constructor() {
    this.repository = AppDataSource.getRepository(AnalyticsEvent);
  }

  async trackEvent(data: any): Promise<AnalyticsEvent> {
    const event = this.repository.create({
      eventId: uuidv4(),
      ...data,
    });
    return await this.repository.save(event);
  }

  async getEventsByType(eventType: AnalyticsEventType, startDate?: Date, endDate?: Date): Promise<AnalyticsEvent[]> {
    const where: any = { eventType };
    
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    return await this.repository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 1000,
    });
  }

  async getUserEvents(userId: string): Promise<AnalyticsEvent[]> {
    return await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getEventCount(eventType?: AnalyticsEventType, startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = eventType ? { eventType } : {};
    
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    return await this.repository.count({ where });
  }

  async getTopProducts(limit: number = 10): Promise<any[]> {
    const results = await this.repository
      .createQueryBuilder('event')
      .select("event.properties->>'productId'", 'productId')
      .addSelect('COUNT(*)', 'count')
      .where("event.eventType = :type", { type: AnalyticsEventType.PRODUCT_VIEW })
      .groupBy("event.properties->>'productId'")
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results;
  }
}
