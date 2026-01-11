import { DataSource } from 'typeorm';
import { Wishlist } from '@models/Wishlist';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'doa_wishlists',
  synchronize: true,
  logging: false,
  entities: [Wishlist],
});

export async function initializeDatabase(): Promise<void> {
  await AppDataSource.initialize();
}
