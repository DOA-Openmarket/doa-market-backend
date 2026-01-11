import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { Notification } from '@models/Notification';

export class NotificationService {
  private repository: Repository<Notification>;

  constructor() {
    this.repository = AppDataSource.getRepository(Notification);
  }

  async create(data: any): Promise<Notification> {
    const notification = this.repository.create({ notificationId: uuidv4(), ...data });
    return await this.repository.save(notification);
  }

  async getByUser(userId: string): Promise<Notification[]> {
    return await this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.repository.update(notificationId, { isRead: true });
  }
}
