import { DataSource } from 'typeorm';
import { Notification } from '@models/Notification';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'doa_notifications',
  synchronize: true,
  logging: false,
  entities: [Notification],
});

export async function initializeDatabase(): Promise<void> {
  await AppDataSource.initialize();
}
