import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('reviews')
@Index(['productId'])
@Index(['userId'])
export class Review {
  @PrimaryColumn('uuid')
  reviewId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ type: 'integer', default: 5 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'json', nullable: true })
  images: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
