import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('search_logs')
@Index(['userId'])
@Index(['keyword'])
@Index(['createdAt'])
export class SearchLog {
  @PrimaryColumn('uuid')
  searchLogId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 255 })
  keyword: string;

  @Column({ name: 'result_count', type: 'integer', default: 0 })
  resultCount: number;

  @Column({ name: 'filters', type: 'jsonb', nullable: true, default: {} })
  filters: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
