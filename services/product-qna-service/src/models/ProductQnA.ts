import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum QnAStatus {
  PENDING = 'pending', // 답변 대기
  ANSWERED = 'answered', // 답변 완료
  DELETED = 'deleted', // 삭제됨
}

@Entity('product_qna')
@Index(['productId'])
@Index(['userId'])
@Index(['sellerId'])
@Index(['status'])
@Index(['createdAt'])
@Index(['isSecret'])
export class ProductQnA {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId: string; // 판매자 ID

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  answer: string | null;

  @Column({ type: 'enum', enum: QnAStatus, default: QnAStatus.PENDING })
  status: QnAStatus;

  @Column({ name: 'is_secret', type: 'boolean', default: false })
  isSecret: boolean; // 비밀글 여부

  @Column({ name: 'answered_at', type: 'timestamp', nullable: true })
  answeredAt: Date | null;

  @Column({ name: 'answered_by', type: 'uuid', nullable: true })
  answeredBy: string | null; // 답변자 ID (판매자 또는 관리자)

  @Column({ name: 'helpful_count', type: 'integer', default: 0 })
  helpfulCount: number; // 도움이 됐어요 수

  @Column({ name: 'images', type: 'jsonb', nullable: true, default: [] })
  images: string[];

  @Column({ name: 'answer_images', type: 'jsonb', nullable: true, default: [] })
  answerImages: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('qna_helpful')
@Index(['qnaId', 'userId'], { unique: true })
export class QnAHelpful {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'qna_id', type: 'uuid' })
  qnaId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

