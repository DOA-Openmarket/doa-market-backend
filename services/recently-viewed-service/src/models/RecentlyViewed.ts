import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('recently_viewed')
@Index(['userId', 'productId'], { unique: true })
@Index(['userId', 'viewedAt'])
@Index(['viewedAt'])
export class RecentlyViewed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'viewed_at', type: 'timestamp' })
  viewedAt: Date;

  @Column({ name: 'view_count', type: 'integer', default: 1 })
  viewCount: number; // 조회 횟수

  // 상품 정보 캐싱 (상품 서비스 응답 느릴 경우 대비)
  @Column({ name: 'product_name', type: 'varchar', length: 255, nullable: true })
  productName: string | null;

  @Column({ name: 'product_price', type: 'integer', nullable: true })
  productPrice: number | null;

  @Column({ name: 'product_image', type: 'varchar', length: 500, nullable: true })
  productImage: string | null;

  @Column({ name: 'seller_name', type: 'varchar', length: 100, nullable: true })
  sellerName: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

