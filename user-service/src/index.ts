import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found-handler';
import userRoutes from './routes/user.routes';
import addressRoutes from './routes/address.routes';
import pointRoutes from './routes/point.routes';
import checkinRoutes from './routes/checkin.routes';
import inquiryRoutes from './routes/inquiry.routes';
import reviewRoutes from './routes/review.routes';
import noticeRoutes from './routes/notice.routes';
import wishlistRoutes from './routes/wishlist.routes';
import { logger } from './utils/logger';
import { sequelize } from './config/database';
import { swaggerSpec } from './config/swagger';
import './models/user.model';
import './models/address.model';
import './models/point.model';
import './models/daily-checkin.model';
import './models/inquiry.model';
import './models/review.model';
import './models/wishlist.model';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'User Service API Docs',
}));

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/profiles`, userRoutes); // Alias for users
app.use(`${API_PREFIX}/users/:userId/addresses`, addressRoutes);
app.use(`${API_PREFIX}/users`, pointRoutes); // Point routes
app.use(`${API_PREFIX}/users`, checkinRoutes); // Checkin routes
app.use(`${API_PREFIX}/users`, inquiryRoutes); // Inquiry routes
app.use(`${API_PREFIX}/users`, reviewRoutes); // Review routes
app.use(`${API_PREFIX}/notices`, noticeRoutes); // Notice routes (public)
app.use(`${API_PREFIX}/wishlist`, wishlistRoutes); // Wishlist routes

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Sync database models (alter: true to update existing tables)
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');

    app.listen(PORT, () => {
      logger.info(`User Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
export default app;

