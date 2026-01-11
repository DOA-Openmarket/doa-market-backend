import Inquiry from '../models/inquiry.model';

class InquiryService {
  /**
   * 문의 목록 조회
   */
  async getInquiries(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Inquiry.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      inquiries: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 문의 상세 조회
   */
  async getInquiry(userId: string, inquiryId: string) {
    const inquiry = await Inquiry.findOne({
      where: {
        id: inquiryId,
        userId,
      },
    });

    if (!inquiry) {
      throw new Error('문의를 찾을 수 없습니다');
    }

    return inquiry;
  }

  /**
   * 문의 작성
   */
  async createInquiry(
    userId: string,
    data: {
      title: string;
      content: string;
      category: string;
      imageUrls?: string[];
    }
  ) {
    const inquiry = await Inquiry.create({
      userId,
      ...data,
    });

    return inquiry;
  }

  /**
   * 문의 답변 (관리자용)
   */
  async answerInquiry(
    inquiryId: string,
    answer: string,
    answeredBy: string
  ) {
    const inquiry = await Inquiry.findByPk(inquiryId);

    if (!inquiry) {
      throw new Error('문의를 찾을 수 없습니다');
    }

    inquiry.answer = answer;
    inquiry.answeredBy = answeredBy;
    inquiry.answeredAt = new Date();
    inquiry.status = 'answered';

    await inquiry.save();

    return inquiry;
  }

  /**
   * 상태별 문의 조회
   */
  async getInquiriesByStatus(
    userId: string,
    status: 'pending' | 'answered',
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Inquiry.findAndCountAll({
      where: { userId, status },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      inquiries: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

export default new InquiryService();
