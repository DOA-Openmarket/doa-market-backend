import { DataSource } from 'typeorm';
import { AnalyticsEvent } from '@models/Analytics';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'doa_analytics',
  synchronize: true,
  logging: false,
  entities: [AnalyticsEvent],
});

export async function initializeDatabase(): Promise<void> {
  await AppDataSource.initialize();
}
