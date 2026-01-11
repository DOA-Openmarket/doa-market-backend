import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from '@config/database';
import notificationRoutes from '@routes/notification.routes';
import { errorHandler, notFoundHandler } from '@middlewares/error-handler';
import logger from '@utils/logger';

dotenv.config();

const app = express();
const PORT = 3009;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, data: { service: 'notification-service', status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() } });
});

app.get('/', (req, res) => {
  res.json({ service: 'notification-service', version: '1.0.0', status: 'running' });
});

app.use('/api/v1/notifications', notificationRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized');
    app.listen(PORT, () => logger.info(`notification-service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
