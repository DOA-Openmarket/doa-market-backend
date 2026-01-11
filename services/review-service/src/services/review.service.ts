import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { Review } from '@models/Review';

export class ReviewService {
  private repository: Repository<Review>;

  constructor() {
    this.repository = AppDataSource.getRepository(Review);
  }

  async createReview(data: any): Promise<Review> {
    const review = this.repository.create({ reviewId: uuidv4(), ...data });
    return await this.repository.save(review);
  }

  async getReviewsByProduct(productId: string): Promise<Review[]> {
    return await this.repository.find({ where: { productId } });
  }
}
