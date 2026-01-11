import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum InquiryType {
  PRODUCT = 'product', // 상품 문의
  ORDER = 'order', // 주문 문의
  DELIVERY = 'delivery', // 배송 문의
  PAYMENT = 'payment', // 결제 문의
  REFUND = 'refund', // 환불 문의
  ACCOUNT = 'account', // 계정 문의
  OTHER = 'other', // 기타
}

export enum InquiryStatus {
  PENDING = 'pending', // 대기중
  IN_PROGRESS = 'in_progress', // 처리중
  ANSWERED = 'answered', // 답변완료
  CLOSED = 'closed', // 종료
}

export enum InquiryPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('inquiries')
@Index(['userId'])
@Index(['status'])
@Index(['type'])
@Index(['createdAt'])
export class Inquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: InquiryType })
  type: InquiryType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: InquiryStatus, default: InquiryStatus.PENDING })
  status: InquiryStatus;

  @Column({ type: 'enum', enum: InquiryPriority, default: InquiryPriority.NORMAL })
  priority: InquiryPriority;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ name: 'images', type: 'jsonb', nullable: true, default: [] })
  images: string[];

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null; // 담당자 ID

  @Column({ name: 'answered_at', type: 'timestamp', nullable: true })
  answeredAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @OneToMany(() => InquiryResponse, response => response.inquiry)
  responses: InquiryResponse[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('inquiry_responses')
@Index(['inquiryId'])
@Index(['createdAt'])
export class InquiryResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inquiry_id', type: 'uuid' })
  inquiryId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // 작성자 ID (고객 또는 관리자)

  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin: boolean; // 관리자 답변 여부

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'images', type: 'jsonb', nullable: true, default: [] })
  images: string[];

  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal: boolean; // 내부 메모 여부 (고객에게 보이지 않음)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  inquiry: Inquiry;
}

