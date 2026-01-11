import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PointType {
  EARNED = 'earned', // 적립
  USED = 'used', // 사용
  EXPIRED = 'expired', // 만료
  REFUNDED = 'refunded', // 환불
  CANCELLED = 'cancelled', // 취소
}

export enum PointSource {
  PURCHASE = 'purchase', // 구매 적립
  REVIEW = 'review', // 리뷰 작성
  SIGNUP = 'signup', // 회원가입
  EVENT = 'event', // 이벤트
  ADMIN = 'admin', // 관리자 지급
  REFERRAL = 'referral', // 추천인
  ATTENDANCE = 'attendance', // 출석체크
}

@Entity('point_transactions')
@Index(['userId'])
@Index(['createdAt'])
@Index(['expiresAt'])
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: PointType })
  type: PointType;

  @Column({ type: 'enum', enum: PointSource })
  source: PointSource;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'integer' })
  balance: number; // 거래 후 잔액

  @Column({ name: 'reference_id', type: 'varchar', length: 255, nullable: true })
  referenceId: string | null; // 주문ID, 리뷰ID 등

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('user_points')
@Index(['userId'], { unique: true })
export class UserPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'total_points', type: 'integer', default: 0 })
  totalPoints: number; // 총 적립 포인트

  @Column({ name: 'available_points', type: 'integer', default: 0 })
  availablePoints: number; // 사용 가능 포인트

  @Column({ name: 'used_points', type: 'integer', default: 0 })
  usedPoints: number; // 사용한 포인트

  @Column({ name: 'expired_points', type: 'integer', default: 0 })
  expiredPoints: number; // 만료된 포인트

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

