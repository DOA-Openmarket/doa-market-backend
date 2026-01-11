import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AdminActionType {
  USER_MANAGEMENT = 'user_management',
  PRODUCT_MANAGEMENT = 'product_management',
  ORDER_MANAGEMENT = 'order_management',
  SYSTEM_SETTINGS = 'system_settings',
  DATA_EXPORT = 'data_export',
}

@Entity('admin_logs')
@Index(['adminId'])
@Index(['actionType'])
@Index(['createdAt'])
export class AdminLog {
  @PrimaryColumn('uuid')
  logId: string;

  @Column({ name: 'admin_id', type: 'uuid' })
  adminId: string;

  @Column({ name: 'action_type', type: 'enum', enum: AdminActionType })
  actionType: AdminActionType;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, any>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
