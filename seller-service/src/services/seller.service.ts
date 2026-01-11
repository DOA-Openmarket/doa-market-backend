import Seller from '../models/seller.model';
import { Op } from 'sequelize';

export interface CreateSellerDto {
  userId: string;
  storeName: string;
  businessNumber: string;
  status?: string;
}

export interface UpdateSellerDto {
  storeName?: string;
  businessNumber?: string;
  status?: string;
}

export class SellerService {
  async findAll(query?: { userId?: string; status?: string; search?: string }) {
    const where: any = {};

    if (query?.userId) {
      where.userId = query.userId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      where[Op.or] = [
        { storeName: { [Op.iLike]: `%${query.search}%` } },
        { businessNumber: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const sellers = await Seller.findAll({ where });
    return sellers;
  }

  async findById(id: string) {
    const seller = await Seller.findByPk(id);
    if (!seller) {
      throw new Error('Seller not found');
    }
    return seller;
  }

  async create(data: CreateSellerDto) {
    // Check if business number already exists
    const existing = await Seller.findOne({
      where: { businessNumber: data.businessNumber },
    });

    if (existing) {
      throw new Error('Business number already registered');
    }

    // Check if user already has a seller account
    const existingUser = await Seller.findOne({
      where: { userId: data.userId },
    });

    if (existingUser) {
      throw new Error('User already has a seller account');
    }

    const seller = await Seller.create({
      userId: data.userId,
      storeName: data.storeName,
      businessNumber: data.businessNumber,
      status: data.status || 'pending',
    });

    return seller;
  }

  async update(id: string, data: UpdateSellerDto) {
    const seller = await this.findById(id);

    // Check if business number is being changed and already exists
    if (data.businessNumber && data.businessNumber !== seller.businessNumber) {
      const existing = await Seller.findOne({
        where: {
          businessNumber: data.businessNumber,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        throw new Error('Business number already registered');
      }
    }

    await seller.update(data);
    return seller;
  }

  async delete(id: string) {
    const seller = await this.findById(id);
    await seller.destroy();
    return { message: 'Seller deleted successfully' };
  }

  async verify(id: string) {
    const seller = await this.findById(id);
    seller.status = 'verified';
    seller.verifiedAt = new Date();
    await seller.save();
    return seller;
  }

  async getStats() {
    const [total, pending, verified, rejected, suspended] = await Promise.all([
      Seller.count(),
      Seller.count({ where: { status: 'pending' } }),
      Seller.count({ where: { status: 'verified' } }),
      Seller.count({ where: { status: 'rejected' } }),
      Seller.count({ where: { status: 'suspended' } }),
    ]);

    // Get recent sellers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSellers = await Seller.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    });

    return {
      total,
      byStatus: {
        pending,
        verified,
        rejected,
        suspended,
      },
      recentSellers,
    };
  }

  async getAttachments(sellerId: string) {
    // TODO: Implement attachment retrieval from file-service
    // For now, return empty array
    return [];
  }
}

export default new SellerService();
