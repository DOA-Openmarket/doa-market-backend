import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SellerStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
  INACTIVE = 'inactive',
}

export enum SellerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

@Entity('sellers')
@Index(['userId'], { unique: true })
@Index(['businessNumber'], { unique: true, where: 'business_number IS NOT NULL' })
@Index(['status'])
export class Seller {
  @PrimaryColumn('uuid')
  sellerId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: SellerType, default: SellerType.INDIVIDUAL })
  type: SellerType;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName: string;

  @Column({ name: 'business_number', type: 'varchar', length: 50, nullable: true, unique: true })
  businessNumber: string | null;

  @Column({ name: 'representative_name', type: 'varchar', length: 100, nullable: true })
  representativeName: string | null;

  @Column({ name: 'business_address', type: 'varchar', length: 500, nullable: true })
  businessAddress: string | null;

  @Column({ name: 'business_phone', type: 'varchar', length: 20, nullable: true })
  businessPhone: string | null;

  @Column({ name: 'business_email', type: 'varchar', length: 255, nullable: true })
  businessEmail: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ name: 'banner_url', type: 'varchar', length: 500, nullable: true })
  bannerUrl: string | null;

  @Column({ type: 'enum', enum: SellerStatus, default: SellerStatus.PENDING })
  status: SellerStatus;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  commissionRate: number;

  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName: string | null;

  @Column({ name: 'bank_account', type: 'varchar', length: 100, nullable: true })
  bankAccount: string | null;

  @Column({ name: 'account_holder', type: 'varchar', length: 100, nullable: true })
  accountHolder: string | null;

  @Column({ name: 'total_sales', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalSales: number;

  @Column({ name: 'total_products', type: 'int', default: 0 })
  totalProducts: number;

  @Column({ name: 'rating_average', type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAverage: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'rejected_reason', type: 'text', nullable: true })
  rejectedReason: string | null;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
