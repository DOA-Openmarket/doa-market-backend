import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { AdminLog, AdminActionType } from '@models/AdminLog';

export class AdminService {
  private repository: Repository<AdminLog>;

  constructor() {
    this.repository = AppDataSource.getRepository(AdminLog);
  }

  async logAction(data: any): Promise<AdminLog> {
    const log = this.repository.create({
      logId: uuidv4(),
      ...data,
    });
    return await this.repository.save(log);
  }

  async getAdminLogs(adminId?: string, actionType?: AdminActionType, limit: number = 100): Promise<AdminLog[]> {
    const where: any = {};
    if (adminId) where.adminId = adminId;
    if (actionType) where.actionType = actionType;

    return await this.repository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getSystemStats(): Promise<any> {
    return {
      totalAdminActions: await this.repository.count(),
      recentActions: await this.repository.count({
        where: {
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      }),
    };
  }
}
