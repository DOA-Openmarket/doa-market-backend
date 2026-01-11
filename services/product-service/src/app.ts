import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import AWSXRay from 'aws-xray-sdk';
import routes from './routes';
import { errorHandler, notFoundHandler } from '@middlewares/error.middleware';
import { logger, loggerStream } from '@utils/logger';

// X-Ray tracing
if (process.env.XRAY_ENABLED === 'true') {
  AWSXRay.captureHTTPsGlobal(require('http'));
  AWSXRay.captureHTTPsGlobal(require('https'));
  AWSXRay.capturePromise();
}

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request:', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// X-Ray middleware
if (process.env.XRAY_ENABLED === 'true') {
  app.use(AWSXRay.express.openSegment(process.env.SERVICE_NAME || 'product-service'));
}

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'product-service',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    },
  });
});

// X-Ray close segment
if (process.env.XRAY_ENABLED === 'true') {
  app.use(AWSXRay.express.closeSegment());
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
