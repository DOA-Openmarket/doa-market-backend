import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Shipping } from '@models/Shipping';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'doa_shipping',
  synchronize: process.env.NODE_ENV === 'development',
  logging: false,
  entities: [Shipping],
});

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}
