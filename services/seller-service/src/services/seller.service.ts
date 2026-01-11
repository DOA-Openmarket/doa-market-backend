import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { Seller, SellerStatus, SellerType } from '@models/Seller';
import logger from '@utils/logger';

export interface CreateSellerInput {
  userId: string;
  type: SellerType;
  businessName: string;
  businessNumber?: string;
  representativeName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  description?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
}

export interface UpdateSellerInput {
  businessName?: string;
  businessNumber?: string;
  representativeName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  settings?: Record<string, any>;
}

export interface SellerQueryParams {
  page?: number;
  limit?: number;
  status?: SellerStatus;
  type?: SellerType;
  search?: string;
}

export class SellerService {
  private repository: Repository<Seller>;

  constructor() {
    this.repository = AppDataSource.getRepository(Seller);
  }

  async createSeller(input: CreateSellerInput): Promise<Seller> {
    const existingSeller = await this.repository.findOne({
      where: { userId: input.userId },
    });

    if (existingSeller) {
      throw new Error('Seller already exists for this user');
    }

    if (input.businessNumber) {
      const duplicateBusinessNumber = await this.repository.findOne({
        where: { businessNumber: input.businessNumber },
      });

      if (duplicateBusinessNumber) {
        throw new Error('Business number already registered');
      }
    }

    const seller = this.repository.create({
      sellerId: uuidv4(),
      userId: input.userId,
      type: input.type,
      businessName: input.businessName,
      businessNumber: input.businessNumber || null,
      representativeName: input.representativeName || null,
      businessAddress: input.businessAddress || null,
      businessPhone: input.businessPhone || null,
      businessEmail: input.businessEmail || null,
      description: input.description || null,
      bankName: input.bankName || null,
      bankAccount: input.bankAccount || null,
      accountHolder: input.accountHolder || null,
      status: SellerStatus.PENDING,
    });

    await this.repository.save(seller);
    logger.info(`Seller created: ${seller.sellerId} for user: ${input.userId}`);

    return seller;
  }

  async getSeller(sellerId: string): Promise<Seller | null> {
    return this.repository.findOne({
      where: { sellerId },
    });
  }

  async getSellerByUserId(userId: string): Promise<Seller | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  async updateSeller(sellerId: string, input: UpdateSellerInput): Promise<Seller> {
    const seller = await this.repository.findOne({
      where: { sellerId },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    Object.assign(seller, input);
    await this.repository.save(seller);

    logger.info(`Seller updated: ${sellerId}`);

    return seller;
  }

  async approveSeller(sellerId: string, approvedBy: string): Promise<Seller> {
    const seller = await this.repository.findOne({
      where: { sellerId },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    if (seller.status !== SellerStatus.PENDING) {
      throw new Error('Only pending sellers can be approved');
    }

    seller.status = SellerStatus.ACTIVE;
    seller.approvedAt = new Date();
    seller.approvedBy = approvedBy;

    await this.repository.save(seller);

    logger.info(`Seller approved: ${sellerId} by ${approvedBy}`);

    return seller;
  }

  async rejectSeller(
    sellerId: string,
    reason: string
  ): Promise<Seller> {
    const seller = await this.repository.findOne({
      where: { sellerId },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    if (seller.status !== SellerStatus.PENDING) {
      throw new Error('Only pending sellers can be rejected');
    }

    seller.status = SellerStatus.REJECTED;
    seller.rejectedAt = new Date();
    seller.rejectedReason = reason;

    await this.repository.save(seller);

    logger.info(`Seller rejected: ${sellerId}`);

    return seller;
  }

  async suspendSeller(sellerId: string): Promise<Seller> {
    const seller = await this.repository.findOne({
      where: { sellerId },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    seller.status = SellerStatus.SUSPENDED;
    await this.repository.save(seller);

    logger.info(`Seller suspended: ${sellerId}`);

    return seller;
  }

  async activateSeller(sellerId: string): Promise<Seller> {
    const seller = await this.repository.findOne({
      where: { sellerId },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    seller.status = SellerStatus.ACTIVE;
    await this.repository.save(seller);

    logger.info(`Seller activated: ${sellerId}`);

    return seller;
  }

  async getAllSellers(params: SellerQueryParams): Promise<{
    sellers: Seller[];
    total: number;
    pages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('seller');

    if (params.status) {
      queryBuilder.andWhere('seller.status = :status', { status: params.status });
    }

    if (params.type) {
      queryBuilder.andWhere('seller.type = :type', { type: params.type });
    }

    if (params.search) {
      queryBuilder.andWhere(
        '(seller.businessName ILIKE :search OR seller.representativeName ILIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    const [sellers, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('seller.createdAt', 'DESC')
      .getManyAndCount();

    return {
      sellers,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async updateSellerStats(
    sellerId: string,
    stats: {
      totalSales?: number;
      totalProducts?: number;
      ratingAverage?: number;
      ratingCount?: number;
    }
  ): Promise<Seller> {
    const seller = await this.repository.findOne({
      where: { sellerId },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    if (stats.totalSales !== undefined) {
      seller.totalSales = stats.totalSales;
    }
    if (stats.totalProducts !== undefined) {
      seller.totalProducts = stats.totalProducts;
    }
    if (stats.ratingAverage !== undefined) {
      seller.ratingAverage = stats.ratingAverage;
    }
    if (stats.ratingCount !== undefined) {
      seller.ratingCount = stats.ratingCount;
    }

    await this.repository.save(seller);

    logger.info(`Seller stats updated: ${sellerId}`);

    return seller;
  }

  async deleteSeller(sellerId: string): Promise<void> {
    const result = await this.repository.delete({ sellerId });

    if (result.affected === 0) {
      throw new Error('Seller not found');
    }

    logger.info(`Seller deleted: ${sellerId}`);
  }
}
