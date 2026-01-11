import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TierLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  VIP = 'vip',
}

@Entity('user_tiers')
@Index(['userId'], { unique: true })
export class UserTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'enum', enum: TierLevel, default: TierLevel.BRONZE })
  tier: TierLevel;

  @Column({ name: 'total_purchase_amount', type: 'bigint', default: 0 })
  totalPurchaseAmount: number; // 총 구매 금액

  @Column({ name: 'total_order_count', type: 'integer', default: 0 })
  totalOrderCount: number; // 총 주문 수

  @Column({ name: 'total_review_count', type: 'integer', default: 0 })
  totalReviewCount: number; // 총 리뷰 수

  @Column({ name: 'tier_points', type: 'integer', default: 0 })
  tierPoints: number; // 등급 포인트 (등급 산정용)

  @Column({ name: 'next_tier', type: 'enum', enum: TierLevel, nullable: true })
  nextTier: TierLevel | null; // 다음 등급

  @Column({ name: 'next_tier_progress', type: 'integer', default: 0 })
  nextTierProgress: number; // 다음 등급까지 진행률 (0-100)

  @Column({ name: 'tier_benefits', type: 'jsonb', default: {} })
  tierBenefits: {
    discountRate?: number; // 할인율
    pointRate?: number; // 적립률
    freeShipping?: boolean; // 무료배송
    prioritySupport?: boolean; // 우선 고객지원
    exclusiveAccess?: boolean; // 단독 상품 접근
  };

  @Column({ name: 'achieved_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  achievedAt: Date; // 현재 등급 달성 시간

  @Column({ name: 'review_period_start', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reviewPeriodStart: Date; // 등급 심사 기간 시작 (보통 1년)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('tier_history')
@Index(['userId'])
@Index(['createdAt'])
export class TierHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'from_tier', type: 'enum', enum: TierLevel })
  fromTier: TierLevel;

  @Column({ name: 'to_tier', type: 'enum', enum: TierLevel })
  toTier: TierLevel;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'purchase_amount_at_change', type: 'bigint', default: 0 })
  purchaseAmountAtChange: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// 등급별 기준
export const TIER_REQUIREMENTS = {
  [TierLevel.BRONZE]: {
    minPurchaseAmount: 0,
    minOrderCount: 0,
    benefits: {
      discountRate: 0,
      pointRate: 1,
      freeShipping: false,
      prioritySupport: false,
      exclusiveAccess: false,
    },
  },
  [TierLevel.SILVER]: {
    minPurchaseAmount: 100000, // 10만원
    minOrderCount: 3,
    benefits: {
      discountRate: 2,
      pointRate: 1.5,
      freeShipping: false,
      prioritySupport: false,
      exclusiveAccess: false,
    },
  },
  [TierLevel.GOLD]: {
    minPurchaseAmount: 500000, // 50만원
    minOrderCount: 10,
    benefits: {
      discountRate: 3,
      pointRate: 2,
      freeShipping: true,
      prioritySupport: false,
      exclusiveAccess: false,
    },
  },
  [TierLevel.PLATINUM]: {
    minPurchaseAmount: 1000000, // 100만원
    minOrderCount: 20,
    benefits: {
      discountRate: 5,
      pointRate: 3,
      freeShipping: true,
      prioritySupport: true,
      exclusiveAccess: false,
    },
  },
  [TierLevel.DIAMOND]: {
    minPurchaseAmount: 3000000, // 300만원
    minOrderCount: 50,
    benefits: {
      discountRate: 7,
      pointRate: 5,
      freeShipping: true,
      prioritySupport: true,
      exclusiveAccess: true,
    },
  },
  [TierLevel.VIP]: {
    minPurchaseAmount: 10000000, // 1000만원
    minOrderCount: 100,
    benefits: {
      discountRate: 10,
      pointRate: 10,
      freeShipping: true,
      prioritySupport: true,
      exclusiveAccess: true,
    },
  },
};

