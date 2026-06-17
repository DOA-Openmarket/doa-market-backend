import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sellerRoutes from './routes/seller.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'seller-service', timestamp: new Date().toISOString() });
});

app.use('/api/v1/sellers', sellerRoutes);

const startServer = async () => {
  const dbSync = process.env.DB_SYNC === 'true';
  const dbForce = process.env.DB_FORCE === 'true';
  await sequelize.sync({ alter: dbSync, force: dbForce });
  logger.info(`Database synchronized (alter: ${dbSync}, force: ${dbForce})`);

  // Idempotent migration: add seller profile columns if missing
  await sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='phone') THEN
        ALTER TABLE sellers ADD COLUMN phone VARCHAR(20);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='bankType') THEN
        ALTER TABLE sellers ADD COLUMN "bankType" VARCHAR(20);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='bankAccount') THEN
        ALTER TABLE sellers ADD COLUMN "bankAccount" VARCHAR(50);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='depositorName') THEN
        ALTER TABLE sellers ADD COLUMN "depositorName" VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='ceoName') THEN
        ALTER TABLE sellers ADD COLUMN "ceoName" VARCHAR(100);
      END IF;
    END
    $$;
  `);
  logger.info('Seller profile columns migration complete');
  app.listen(PORT, () => logger.info(`Seller Service on port ${PORT}`));
};

startServer();
export default app;

