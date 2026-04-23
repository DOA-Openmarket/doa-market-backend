import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import adminRoutes from './routes/admin.routes';
import noticeRoutes from './routes/notice.routes';
import inquiryRoutes from './routes/inquiry.routes';
import policyRoutes from './routes/policy.routes';
import guideRoutes from './routes/guide.routes';
import faqRoutes from './routes/faq.routes';
import errorReportRoutes from './routes/error-report.routes';
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
app.use('/api/v1/admin/guides', guideRoutes);
app.use('/api/v1/admin/faqs', faqRoutes);
app.use('/api/v1/admin/error-reports', errorReportRoutes);
app.use('/api/v1/error-reports', errorReportRoutes); // Seller-accessible path
app.use('/api/v1/inquiries', inquiryRoutes); // Admin frontend uses this path

// Public routes (no admin prefix)
app.use('/api/v1/notices', noticeRoutes); // Public notice access for user app
app.use('/api/v1/guides', guideRoutes); // Public guide access for user app
app.use('/api/v1/faqs', faqRoutes); // Public FAQ access for user app
app.use('/api/v1/faq', faqRoutes); // Admin frontend uses this path
app.use('/api/v1/terms', policyRoutes); // Public terms/policy access for partner app

const startServer = async () => {
  try {
    // Sync database models (create tables if not exist)
    await sequelize.sync();
    logger.info('Database synchronized');

    // Safe migration: add missing columns without alter:true (avoids ENUM breakage)
    try {
      await sequelize.query(`
        ALTER TABLE error_reports ADD COLUMN IF NOT EXISTS type VARCHAR(255) DEFAULT 'error';
      `);
      logger.info('Migration: error_reports.type column ensured');
    } catch (migErr: any) {
      logger.warn('Migration warning (non-fatal):', migErr.message);
    }

    app.listen(PORT, () => logger.info(`Admin Service on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
export default app;

