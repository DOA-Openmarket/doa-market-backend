import { Request, Response } from 'express';
import { ReviewService } from '@services/review.service';

const service = new ReviewService();

export class ReviewController {
  async create(req: Request, res: Response) {
    try {
      const review = await service.createReview(req.body);
      res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getByProduct(req: Request, res: Response) {
    try {
      const reviews = await service.getReviewsByProduct(req.params.productId);
      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const reviewController = new ReviewController();
