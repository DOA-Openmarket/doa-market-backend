import { AppDataSource } from '@config/database';
import { Product } from '@models/Product';
import { Repository, FindOptionsWhere, ILike, Between, In } from 'typeorm';
import { ProductFilter, PaginationQuery } from '@/types';
import { logger } from '@utils/logger';

export class ProductRepository {
  private repository: Repository<Product>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
  }

  async findById(id: string): Promise<Product | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['category', 'images', 'variants'],
      });
    } catch (error) {
      logger.error('Error finding product by ID:', { id, error });
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<Product | null> {
    try {
      return await this.repository.findOne({
        where: { slug },
        relations: ['category', 'images', 'variants'],
      });
    } catch (error) {
      logger.error('Error finding product by slug:', { slug, error });
      throw error;
    }
  }

  async findAll(
    filter: ProductFilter,
    pagination: PaginationQuery
  ): Promise<{ products: Product[]; total: number }> {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
      const skip = (page - 1) * limit;

      const where: FindOptionsWhere<Product> = {};

      if (filter.categoryId) {
        where.categoryId = filter.categoryId;
      }

      if (filter.sellerId) {
        where.sellerId = filter.sellerId;
      }

      if (filter.status) {
        where.status = filter.status;
      }

      if (filter.search) {
        where.name = ILike(`%${filter.search}%`);
      }

      // Price range filter
      if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
        const min = filter.minPrice || 0;
        const max = filter.maxPrice || Number.MAX_SAFE_INTEGER;
        where.price = Between(min, max) as any;
      }

      const [products, total] = await this.repository.findAndCount({
        where,
        relations: ['category', 'images'],
        order: { [sortBy]: sortOrder },
        skip,
        take: limit,
      });

      return { products, total };
    } catch (error) {
      logger.error('Error finding products:', { filter, pagination, error });
      throw error;
    }
  }

  async create(productData: Partial<Product>): Promise<Product> {
    try {
      const product = this.repository.create(productData);
      return await this.repository.save(product);
    } catch (error) {
      logger.error('Error creating product:', { productData, error });
      throw error;
    }
  }

  async update(id: string, productData: Partial<Product>): Promise<Product | null> {
    try {
      await this.repository.update(id, productData);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating product:', { id, productData, error });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.softDelete(id);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      logger.error('Error deleting product:', { id, error });
      throw error;
    }
  }

  async updateStock(id: string, quantity: number): Promise<Product | null> {
    try {
      await this.repository.increment({ id }, 'stockQuantity', quantity);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating product stock:', { id, quantity, error });
      throw error;
    }
  }

  async updateRating(id: string, rating: number, reviewCount: number): Promise<Product | null> {
    try {
      await this.repository.update(id, {
        ratingAvg: rating,
        reviewCount,
      });
      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating product rating:', { id, rating, reviewCount, error });
      throw error;
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    try {
      await this.repository.increment({ id }, 'viewCount', 1);
    } catch (error) {
      logger.error('Error incrementing view count:', { id, error });
      // Don't throw error for view count
    }
  }

  async incrementSalesCount(id: string, count: number = 1): Promise<void> {
    try {
      await this.repository.increment({ id }, 'salesCount', count);
    } catch (error) {
      logger.error('Error incrementing sales count:', { id, count, error });
      throw error;
    }
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    try {
      return await this.repository.find({
        where: { id: In(ids) },
        relations: ['category', 'images'],
      });
    } catch (error) {
      logger.error('Error finding products by IDs:', { ids, error });
      throw error;
    }
  }

  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const where: FindOptionsWhere<Product> = { slug };
      const query = this.repository.createQueryBuilder('product').where('product.slug = :slug', { slug });

      if (excludeId) {
        query.andWhere('product.id != :excludeId', { excludeId });
      }

      const count = await query.getCount();
      return count > 0;
    } catch (error) {
      logger.error('Error checking slug existence:', { slug, error });
      throw error;
    }
  }
}

export const productRepository = new ProductRepository();
