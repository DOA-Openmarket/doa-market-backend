import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  PURCHASE = 'purchase',
  SEARCH = 'search',
  CLICK = 'click',
}

@Entity('analytics_events')
@Index(['eventType'])
@Index(['userId'])
@Index(['createdAt'])
export class AnalyticsEvent {
  @PrimaryColumn('uuid')
  eventId: string;

  @Column({ name: 'event_type', type: 'enum', enum: AnalyticsEventType })
  eventType: AnalyticsEventType;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId: string | null;

  @Column({ type: 'jsonb', default: {} })
  properties: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
