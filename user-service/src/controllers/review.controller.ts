import { Request, Response, NextFunction } from 'express';
import reviewService from '../services/review.service';

export class ReviewController {
  /**
   * 내 리뷰 목록 조회
   * GET /api/v1/users/:userId/reviews
   */
  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await reviewService.getMyReviews(userId, page, limit);

      res.json({
        success: true,
        data: result.reviews,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 상품 리뷰 목록 조회
   * GET /api/v1/products/:productId/reviews
   */
  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await reviewService.getProductReviews(productId, page, limit);

      res.json({
        success: true,
        data: result.reviews,
        statistics: result.statistics,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 리뷰 작성
   * POST /api/v1/users/:userId/reviews
   */
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { productId, orderId, rating, content, imageUrls } = req.body;

      if (!productId || !orderId) {
        return res.status(400).json({
          success: false,
          message: '상품 ID와 주문 ID가 필요합니다',
        });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: '별점은 1-5 사이여야 합니다',
        });
      }

      if (!content || content.length < 10) {
        return res.status(400).json({
          success: false,
          message: '리뷰 내용은 최소 10자 이상이어야 합니다',
        });
      }

      const review = await reviewService.createReview(userId, {
        productId,
        orderId,
        rating,
        content,
        imageUrls,
      });

      res.status(201).json({
        success: true,
        data: review,
        message: '리뷰가 작성되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 리뷰 수정
   * PUT /api/v1/users/:userId/reviews/:reviewId
   */
  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, reviewId } = req.params;
      const { rating, content, imageUrls } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: '별점은 1-5 사이여야 합니다',
        });
      }

      if (!content || content.length < 10) {
        return res.status(400).json({
          success: false,
          message: '리뷰 내용은 최소 10자 이상이어야 합니다',
        });
      }

      const review = await reviewService.updateReview(userId, reviewId, {
        rating,
        content,
        imageUrls,
      });

      res.json({
        success: true,
        data: review,
        message: '리뷰가 수정되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 리뷰 삭제
   * DELETE /api/v1/users/:userId/reviews/:reviewId
   */
  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, reviewId } = req.params;

      await reviewService.deleteReview(userId, reviewId);

      res.json({
        success: true,
        message: '리뷰가 삭제되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 리뷰 좋아요
   * POST /api/v1/products/:productId/reviews/:reviewId/like
   */
  async likeReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;

      const review = await reviewService.likeReview(reviewId);

      res.json({
        success: true,
        data: review,
        message: '도움이 돼요!',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
