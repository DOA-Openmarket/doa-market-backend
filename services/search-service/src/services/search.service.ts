import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { AppDataSource } from '@config/database';
import { SearchLog } from '@models/Search';

export class SearchService {
  private repository: Repository<SearchLog>;
  private productServiceUrl: string;

  constructor() {
    this.repository = AppDataSource.getRepository(SearchLog);
    this.productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
  }

  async logSearch(userId: string | null, keyword: string, resultCount: number, filters?: any): Promise<SearchLog> {
    const log = this.repository.create({
      searchLogId: uuidv4(),
      userId,
      keyword,
      resultCount,
      filters: filters || {},
    });
    return await this.repository.save(log);
  }

  async getPopularKeywords(limit: number = 10): Promise<any[]> {
    const results = await this.repository
      .createQueryBuilder('log')
      .select('log.keyword', 'keyword')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.keyword')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results;
  }

  async getUserSearchHistory(userId: string, limit: number = 20): Promise<SearchLog[]> {
    return await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async searchProducts(keyword: string, filters?: any): Promise<any> {
    try {
      // Call product-service search endpoint
      const response = await axios.get(`${this.productServiceUrl}/api/v1/products/search`, {
        params: {
          search: keyword,
          ...filters,
        },
      });

      if (response.data.success) {
        return {
          keyword,
          filters: filters || {},
          products: response.data.data || [],
          total: response.data.meta?.total || response.data.data?.length || 0,
        };
      }

      return {
        keyword,
        filters: filters || {},
        products: [],
        total: 0,
      };
    } catch (error: any) {
      console.error('Error searching products:', error.message);
      return {
        keyword,
        filters: filters || {},
        products: [],
        total: 0,
      };
    }
  }
}
