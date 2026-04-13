import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bannerRoutes from './routes/banner.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3017;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Simple health check for Kubernetes probes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'banner-service', timestamp: new Date().toISOString() });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'banner-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/v1/banners', bannerRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    try {
      const dbSync = process.env.DB_SYNC === 'true';
      await sequelize.sync({ alter: dbSync });
      logger.info('Database synchronized');
    } catch (syncError: any) {
      logger.warn(`Database sync skipped (safe to ignore in production): ${syncError.message}`);
    }
    
    app.listen(PORT, () => {
      logger.info(`Banner Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
export default app;

