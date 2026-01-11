import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { Wishlist } from '@models/Wishlist';

export class WishlistService {
  private repository: Repository<Wishlist>;

  constructor() {
    this.repository = AppDataSource.getRepository(Wishlist);
  }

  async addToWishlist(userId: string, productId: string, metadata?: any): Promise<Wishlist> {
    const existing = await this.repository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      throw new Error('Product already in wishlist');
    }

    const wishlist = this.repository.create({
      wishlistId: uuidv4(),
      userId,
      productId,
      metadata,
    });

    return await this.repository.save(wishlist);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const wishlist = await this.repository.findOne({
      where: { userId, productId },
    });

    if (!wishlist) {
      throw new Error('Product not in wishlist');
    }

    await this.repository.remove(wishlist);
  }

  async getUserWishlist(userId: string): Promise<Wishlist[]> {
    return await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async checkInWishlist(userId: string, productId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, productId },
    });
    return count > 0;
  }

  async getWishlistCount(userId: string): Promise<number> {
    return await this.repository.count({ where: { userId } });
  }
}
