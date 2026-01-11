import { DataSource } from 'typeorm';
import { Coupon } from '@models/Coupon';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'doa_coupons',
  synchronize: true,
  logging: false,
  entities: [Coupon],
});

export async function initializeDatabase(): Promise<void> {
  await AppDataSource.initialize();
}
