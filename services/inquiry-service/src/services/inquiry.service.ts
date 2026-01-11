import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { Inquiry, InquiryResponse, InquiryType, InquiryStatus, InquiryPriority } from '@models/Inquiry';
import logger from '@utils/logger';

export interface CreateInquiryInput {
  userId: string;
  type: InquiryType;
  title: string;
  content: string;
  priority?: InquiryPriority;
  orderId?: string;
  productId?: string;
  images?: string[];
}

export interface CreateResponseInput {
  inquiryId: string;
  userId: string;
  content: string;
  isAdmin?: boolean;
  images?: string[];
  isInternal?: boolean;
}

export interface UpdateInquiryInput {
  status?: InquiryStatus;
  priority?: InquiryPriority;
  assignedTo?: string;
}

export class InquiryService {
  private inquiryRepository: Repository<Inquiry>;
  private responseRepository: Repository<InquiryResponse>;

  constructor() {
    this.inquiryRepository = AppDataSource.getRepository(Inquiry);
    this.responseRepository = AppDataSource.getRepository(InquiryResponse);
  }

  // 1:1 문의 생성
  async createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
    const inquiry = this.inquiryRepository.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      content: input.content,
      priority: input.priority || InquiryPriority.NORMAL,
      orderId: input.orderId || null,
      productId: input.productId || null,
      images: input.images || [],
      status: InquiryStatus.PENDING,
    });

    await this.inquiryRepository.save(inquiry);
    logger.info(`Inquiry created: ${inquiry.id} by user ${input.userId}`);

    return inquiry;
  }

  // 문의 조회
  async getInquiry(id: string, includeResponses: boolean = true): Promise<Inquiry | null> {
    const relations = includeResponses ? ['responses'] : [];

    return this.inquiryRepository.findOne({
      where: { id },
      relations,
      order: {
        responses: {
          createdAt: 'ASC',
        },
      },
    });
  }

  // 사용자 문의 목록 조회
  async getUserInquiries(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ inquiries: Inquiry[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [inquiries, total] = await this.inquiryRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      inquiries,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 모든 문의 목록 조회 (관리자용)
  async getAllInquiries(
    filters: {
      status?: InquiryStatus;
      type?: InquiryType;
      priority?: InquiryPriority;
      assignedTo?: string;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ inquiries: Inquiry[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .skip(skip)
      .take(limit)
      .orderBy('inquiry.createdAt', 'DESC');

    if (filters.status) {
      queryBuilder.andWhere('inquiry.status = :status', { status: filters.status });
    }

    if (filters.type) {
      queryBuilder.andWhere('inquiry.type = :type', { type: filters.type });
    }

    if (filters.priority) {
      queryBuilder.andWhere('inquiry.priority = :priority', { priority: filters.priority });
    }

    if (filters.assignedTo) {
      queryBuilder.andWhere('inquiry.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    const [inquiries, total] = await queryBuilder.getManyAndCount();

    return {
      inquiries,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // 문의 업데이트
  async updateInquiry(id: string, input: UpdateInquiryInput): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({ where: { id } });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    if (input.status) {
      inquiry.status = input.status;

      if (input.status === InquiryStatus.ANSWERED) {
        inquiry.answeredAt = new Date();
      } else if (input.status === InquiryStatus.CLOSED) {
        inquiry.closedAt = new Date();
      }
    }

    if (input.priority) {
      inquiry.priority = input.priority;
    }

    if (input.assignedTo !== undefined) {
      inquiry.assignedTo = input.assignedTo;
    }

    await this.inquiryRepository.save(inquiry);
    logger.info(`Inquiry updated: ${id}`);

    return inquiry;
  }

  // 답변 추가
  async addResponse(input: CreateResponseInput): Promise<InquiryResponse> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id: input.inquiryId },
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const response = this.responseRepository.create({
      inquiryId: input.inquiryId,
      userId: input.userId,
      content: input.content,
      isAdmin: input.isAdmin || false,
      images: input.images || [],
      isInternal: input.isInternal || false,
    });

    await this.responseRepository.save(response);

    // 관리자가 답변하면 상태를 '답변완료'로 변경
    if (input.isAdmin && inquiry.status === InquiryStatus.PENDING) {
      await this.updateInquiry(input.inquiryId, {
        status: InquiryStatus.ANSWERED,
      });
    }

    logger.info(`Response added to inquiry: ${input.inquiryId}`);

    return response;
  }

  // 문의 삭제
  async deleteInquiry(id: string, userId: string): Promise<void> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id, userId },
    });

    if (!inquiry) {
      throw new Error('Inquiry not found or unauthorized');
    }

    // 답변이 없는 문의만 삭제 가능
    const responseCount = await this.responseRepository.count({
      where: { inquiryId: id },
    });

    if (responseCount > 0) {
      throw new Error('Cannot delete inquiry with responses');
    }

    await this.inquiryRepository.delete({ id });
    logger.info(`Inquiry deleted: ${id}`);
  }

  // 문의 통계 조회 (관리자용)
  async getInquiryStats(): Promise<any> {
    const total = await this.inquiryRepository.count();
    const pending = await this.inquiryRepository.count({
      where: { status: InquiryStatus.PENDING },
    });
    const inProgress = await this.inquiryRepository.count({
      where: { status: InquiryStatus.IN_PROGRESS },
    });
    const answered = await this.inquiryRepository.count({
      where: { status: InquiryStatus.ANSWERED },
    });
    const closed = await this.inquiryRepository.count({
      where: { status: InquiryStatus.CLOSED },
    });

    // 타입별 통계
    const byType = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('inquiry.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('inquiry.type')
      .getRawMany();

    return {
      total,
      byStatus: {
        pending,
        inProgress,
        answered,
        closed,
      },
      byType,
    };
  }
}

