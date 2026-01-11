import { DataSource } from 'typeorm';
import { User } from '@/models/User';
import { RefreshToken } from '@/models/RefreshToken';
import logger from '@/utils/logger';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'doa_auth',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities: [User, RefreshToken],
  migrations: [],
  subscribers: [],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  poolSize: parseInt(process.env.DB_POOL_MAX || '10', 10),
  extra: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');

    if (process.env.DB_SYNCHRONIZE === 'true') {
      logger.info('Database initialized successfully');
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};
