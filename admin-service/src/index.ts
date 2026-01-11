import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import adminRoutes from './routes/admin.routes';
import noticeRoutes from './routes/notice.routes';
import inquiryRoutes from './routes/inquiry.routes';
import policyRoutes from './routes/policy.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3014;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-service', timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Admin Service API Docs',
}));

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/notices', noticeRoutes);
app.use('/api/v1/admin/inquiries', inquiryRoutes);
app.use('/api/v1/admin/policies', policyRoutes);

// Public routes (no admin prefix)
app.use('/api/v1/notices', noticeRoutes); // Public notice access for user app

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');
    app.listen(PORT, () => logger.info(`Admin Service on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
export default app;

