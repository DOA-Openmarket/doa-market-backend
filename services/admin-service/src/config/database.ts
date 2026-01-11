import { DataSource } from 'typeorm';
import { AdminLog } from '@models/AdminLog';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'doa_admin',
  synchronize: true,
  logging: false,
  entities: [AdminLog],
});

export async function initializeDatabase(): Promise<void> {
  await AppDataSource.initialize();
}
