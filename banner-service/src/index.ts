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
    
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');
    
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

