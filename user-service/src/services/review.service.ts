import Review from '../models/review.model';

class ReviewService {
  /**
   * 내 리뷰 목록 조회
   */
  async getMyReviews(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      reviews: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 상품 리뷰 목록 조회
   */
  async getProductReviews(productId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // 평균 별점 계산
    const avgRating = await Review.findOne({
      where: { productId },
      attributes: [
        [Review.sequelize!.fn('AVG', Review.sequelize!.col('rating')), 'avgRating'],
      ],
      raw: true,
    }) as any;

    // 별점 분포 계산
    const ratingDistribution = await Review.findAll({
      where: { productId },
      attributes: [
        'rating',
        [Review.sequelize!.fn('COUNT', Review.sequelize!.col('id')), 'count'],
      ],
      group: ['rating'],
      raw: true,
    });

    return {
      reviews: rows,
      statistics: {
        avgRating: avgRating?.avgRating ? parseFloat(avgRating.avgRating).toFixed(1) : '0.0',
        totalReviews: count,
        ratingDistribution,
      },
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 리뷰 작성
   */
  async createReview(
    userId: string,
    data: {
      productId: string;
      orderId: string;
      rating: number;
      content: string;
      imageUrls?: string[];
    }
  ) {
    // 이미 작성한 리뷰가 있는지 확인
    const existing = await Review.findOne({
      where: {
        userId,
        productId: data.productId,
        orderId: data.orderId,
      },
    });

    if (existing) {
      throw new Error('이미 리뷰를 작성했습니다');
    }

    const review = await Review.create({
      userId,
      ...data,
    });

    return review;
  }

  /**
   * 리뷰 수정
   */
  async updateReview(
    userId: string,
    reviewId: string,
    data: {
      rating: number;
      content: string;
      imageUrls?: string[];
    }
  ) {
    const review = await Review.findOne({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다');
    }

    await review.update(data);

    return review;
  }

  /**
   * 리뷰 삭제
   */
  async deleteReview(userId: string, reviewId: string) {
    const review = await Review.findOne({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다');
    }

    await review.destroy();

    return { message: '리뷰가 삭제되었습니다' };
  }

  /**
   * 리뷰 도움이 돼요 (좋아요)
   */
  async likeReview(reviewId: string) {
    const review = await Review.findByPk(reviewId);

    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다');
    }

    review.helpfulCount += 1;
    await review.save();

    return review;
  }
}

export default new ReviewService();
