import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ActivityType {
  // 주문 관련
  ORDER_CREATED = 'order_created',
  ORDER_PAID = 'order_paid',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_REFUNDED = 'order_refunded',

  // 리뷰 관련
  REVIEW_WRITTEN = 'review_written',
  REVIEW_UPDATED = 'review_updated',
  REVIEW_DELETED = 'review_deleted',

  // 상품 관련
  PRODUCT_VIEWED = 'product_viewed',
  PRODUCT_LIKED = 'product_liked',
  WISHLIST_ADDED = 'wishlist_added',
  CART_ADDED = 'cart_added',

  // 문의 관련
  INQUIRY_CREATED = 'inquiry_created',
  QNA_CREATED = 'qna_created',

  // 포인트 관련
  POINT_EARNED = 'point_earned',
  POINT_USED = 'point_used',

  // 등급 관련
  TIER_UPGRADED = 'tier_upgraded',
  TIER_DOWNGRADED = 'tier_downgraded',

  // 계정 관련
  PROFILE_UPDATED = 'profile_updated',
  PASSWORD_CHANGED = 'password_changed',
  ADDRESS_ADDED = 'address_added',
}

@Entity('user_activities')
@Index(['userId'])
@Index(['activityType'])
@Index(['createdAt'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'activity_type', type: 'enum', enum: ActivityType })
  activityType: ActivityType;

  @Column({ name: 'reference_id', type: 'varchar', length: 255, nullable: true })
  referenceId: string | null; // 주문ID, 상품ID 등

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any>; // 추가 정보

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('user_statistics')
@Index(['userId'], { unique: true })
export class UserStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  // 주문 통계
  @Column({ name: 'total_orders', type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ name: 'completed_orders', type: 'integer', default: 0 })
  completedOrders: number;

  @Column({ name: 'cancelled_orders', type: 'integer', default: 0 })
  cancelledOrders: number;

  @Column({ name: 'total_spent', type: 'bigint', default: 0 })
  totalSpent: number; // 총 구매 금액

  @Column({ name: 'average_order_value', type: 'integer', default: 0 })
  averageOrderValue: number; // 평균 주문 금액

  // 상품 통계
  @Column({ name: 'products_viewed', type: 'integer', default: 0 })
  productsViewed: number;

  @Column({ name: 'products_liked', type: 'integer', default: 0 })
  productsLiked: number;

  @Column({ name: 'wishlist_items', type: 'integer', default: 0 })
  wishlistItems: number;

  // 리뷰 통계
  @Column({ name: 'reviews_written', type: 'integer', default: 0 })
  reviewsWritten: number;

  @Column({ name: 'average_rating_given', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRatingGiven: number | null;

  // 문의 통계
  @Column({ name: 'inquiries_made', type: 'integer', default: 0 })
  inquiriesMade: number;

  @Column({ name: 'qnas_asked', type: 'integer', default: 0 })
  qnasAsked: number;

  // 기타
  @Column({ name: 'first_order_at', type: 'timestamp', nullable: true })
  firstOrderAt: Date | null;

  @Column({ name: 'last_order_at', type: 'timestamp', nullable: true })
  lastOrderAt: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

