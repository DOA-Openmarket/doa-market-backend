import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  VIRTUAL_ACCOUNT = 'virtual_account',
  MOBILE_PAYMENT = 'mobile_payment',
  KAKAO_PAY = 'kakao_pay',
  NAVER_PAY = 'naver_pay',
  TOSS_PAY = 'toss_pay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIAL_REFUNDED = 'partial_refunded',
}

@Entity('payments')
@Index(['orderId'])
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class Payment {
  @PrimaryColumn('uuid')
  paymentId: string;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'KRW' })
  currency: string;

  @Column({ name: 'pg_provider', type: 'varchar', length: 50, nullable: true })
  pgProvider: string | null;

  @Column({ name: 'pg_transaction_id', type: 'varchar', length: 255, nullable: true })
  pgTransactionId: string | null;

  @Column({ name: 'pg_response', type: 'jsonb', nullable: true })
  pgResponse: Record<string, any> | null;

  @Column({ name: 'card_number', type: 'varchar', length: 20, nullable: true })
  cardNumber: string | null;

  @Column({ name: 'card_type', type: 'varchar', length: 20, nullable: true })
  cardType: string | null;

  @Column({ name: 'card_issuer', type: 'varchar', length: 50, nullable: true })
  cardIssuer: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string | null;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt: Date | null;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number | null;

  @Column({ name: 'refund_reason', type: 'text', nullable: true })
  refundReason: string | null;

  @Column({ name: 'receipt_url', type: 'text', nullable: true })
  receiptUrl: string | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
