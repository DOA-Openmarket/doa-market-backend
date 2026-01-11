import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { ProductQnA, QnAHelpful, QnAStatus } from '@models/ProductQnA';
import logger from '@utils/logger';

export interface CreateQnAInput {
  productId: string;
  userId: string;
  sellerId: string;
  title: string;
  question: string;
  isSecret?: boolean;
  images?: string[];
}

export interface AnswerQnAInput {
  qnaId: string;
  answeredBy: string;
  answer: string;
  answerImages?: string[];
}

export class ProductQnAService {
  private qnaRepository: Repository<ProductQnA>;
  private helpfulRepository: Repository<QnAHelpful>;

  constructor() {
    this.qnaRepository = AppDataSource.getRepository(ProductQnA);
    this.helpfulRepository = AppDataSource.getRepository(QnAHelpful);
  }

  // 상품 문의 작성
  async createQnA(input: CreateQnAInput): Promise<ProductQnA> {
    const qna = this.qnaRepository.create({
      productId: input.productId,
      userId: input.userId,
      sellerId: input.sellerId,
      title: input.title,
      question: input.question,
      isSecret: input.isSecret || false,
      images: input.images || [],
      status: QnAStatus.PENDING,
    });

    await this.qnaRepository.save(qna);
    logger.info(`Product QnA created: ${qna.id} for product ${input.productId}`);

    return qna;
  }

  // 상품 문의 조회 (단건)
  async getQnA(id: string, userId?: string): Promise<ProductQnA | null> {
    const qna = await this.qnaRepository.findOne({ where: { id } });

    if (!qna) {
      return null;
    }

    // 비밀글인 경우 작성자와 판매자만 조회 가능
    if (qna.isSecret && userId && qna.userId !== userId && qna.sellerId !== userId) {
      throw new Error('Access denied to secret question');
    }

    return qna;
  }

  // 상품별 문의 목록
  async getProductQnAs(
    productId: string,
    userId: string | undefined,
    page: number = 1,
    limit: number = 20
  ): Promise<{ qnas: ProductQnA[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.qnaRepository
      .createQueryBuilder('qna')
      .where('qna.productId = :productId', { productId })
      .andWhere('qna.status != :deletedStatus', { deletedStatus: QnAStatus.DELETED });

    // 비밀글 필터링 (작성자가 아닌 경우)
    if (userId) {
      queryBuilder.andWhere(
        '(qna.isSecret = false OR qna.userId = :userId OR qna.sellerId = :userId)',
        { userId }
      );
    } else {
      queryBuilder.andWhere('qna.isSecret = false');
    }

    const [qnas, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('qna.createdAt', 'DESC')
      .getManyAndCount();

    return {
      qnas,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 사용자별 문의 목록
  async getUserQnAs(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ qnas: ProductQnA[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [qnas, total] = await this.qnaRepository.findAndCount({
      where: {
        userId,
        status: QnAStatus.PENDING as any, // Not deleted
      },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      qnas,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 판매자별 문의 목록
  async getSellerQnAs(
    sellerId: string,
    status?: QnAStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ qnas: ProductQnA[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const where: any = {
      sellerId,
    };

    if (status) {
      where.status = status;
    }

    const [qnas, total] = await this.qnaRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      qnas,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 답변 작성
  async answerQnA(input: AnswerQnAInput): Promise<ProductQnA> {
    const qna = await this.qnaRepository.findOne({
      where: { id: input.qnaId },
    });

    if (!qna) {
      throw new Error('QnA not found');
    }

    if (qna.status === QnAStatus.ANSWERED) {
      throw new Error('QnA already answered');
    }

    qna.answer = input.answer;
    qna.answerImages = input.answerImages || [];
    qna.answeredBy = input.answeredBy;
    qna.answeredAt = new Date();
    qna.status = QnAStatus.ANSWERED;

    await this.qnaRepository.save(qna);
    logger.info(`QnA answered: ${input.qnaId} by ${input.answeredBy}`);

    return qna;
  }

  // 답변 수정
  async updateAnswer(
    qnaId: string,
    answer: string,
    answerImages?: string[]
  ): Promise<ProductQnA> {
    const qna = await this.qnaRepository.findOne({ where: { id: qnaId } });

    if (!qna) {
      throw new Error('QnA not found');
    }

    if (qna.status !== QnAStatus.ANSWERED) {
      throw new Error('QnA is not answered yet');
    }

    qna.answer = answer;
    if (answerImages !== undefined) {
      qna.answerImages = answerImages;
    }

    await this.qnaRepository.save(qna);
    logger.info(`QnA answer updated: ${qnaId}`);

    return qna;
  }

  // 문의 삭제 (소프트 삭제)
  async deleteQnA(id: string, userId: string): Promise<void> {
    const qna = await this.qnaRepository.findOne({ where: { id } });

    if (!qna) {
      throw new Error('QnA not found');
    }

    if (qna.userId !== userId) {
      throw new Error('Unauthorized to delete this QnA');
    }

    // 답변이 달린 경우 삭제 불가
    if (qna.status === QnAStatus.ANSWERED) {
      throw new Error('Cannot delete answered QnA');
    }

    qna.status = QnAStatus.DELETED;
    await this.qnaRepository.save(qna);

    logger.info(`QnA deleted: ${id}`);
  }

  // 도움이 됐어요 추가
  async addHelpful(qnaId: string, userId: string): Promise<void> {
    // 이미 추가했는지 확인
    const existing = await this.helpfulRepository.findOne({
      where: { qnaId, userId },
    });

    if (existing) {
      throw new Error('Already marked as helpful');
    }

    const helpful = this.helpfulRepository.create({
      qnaId,
      userId,
    });

    await this.helpfulRepository.save(helpful);

    // 카운트 증가
    await this.qnaRepository.increment({ id: qnaId }, 'helpfulCount', 1);

    logger.info(`Helpful added to QnA: ${qnaId} by user ${userId}`);
  }

  // 도움이 됐어요 취소
  async removeHelpful(qnaId: string, userId: string): Promise<void> {
    const result = await this.helpfulRepository.delete({ qnaId, userId });

    if (result.affected === 0) {
      throw new Error('Helpful mark not found');
    }

    // 카운트 감소
    await this.qnaRepository.decrement({ id: qnaId }, 'helpfulCount', 1);

    logger.info(`Helpful removed from QnA: ${qnaId} by user ${userId}`);
  }

  // 통계 조회
  async getQnAStats(productId?: string): Promise<any> {
    const queryBuilder = this.qnaRepository.createQueryBuilder('qna');

    if (productId) {
      queryBuilder.where('qna.productId = :productId', { productId });
    }

    const total = await queryBuilder.getCount();

    const pending = await queryBuilder
      .clone()
      .andWhere('qna.status = :status', { status: QnAStatus.PENDING })
      .getCount();

    const answered = await queryBuilder
      .clone()
      .andWhere('qna.status = :status', { status: QnAStatus.ANSWERED })
      .getCount();

    return {
      total,
      pending,
      answered,
      answerRate: total > 0 ? ((answered / total) * 100).toFixed(2) : 0,
    };
  }
}

