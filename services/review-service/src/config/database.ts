import { DataSource } from 'typeorm';
import { Review } from '@models/Review';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'doa_reviews',
  synchronize: true,
  logging: false,
  entities: [Review],
});

export async function initializeDatabase(): Promise<void> {
  await AppDataSource.initialize();
}
