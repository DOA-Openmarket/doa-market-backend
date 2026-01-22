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
  app.listen(PORT, () => logger.info(`Seller Service on port ${PORT}`));
};

startServer();
export default app;

