import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError, sendErrorResponse } from '../utils/errors';
import logger from '../utils/logger';

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// Error logging middleware
export function errorLoggingMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.headers['x-request-id'] as string;

  logger.error('Request failed:', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    user: (req as any).user?.userId,
  });

  next(err);
}

// Global error handler
export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.headers['x-request-id'] as string;
  const path = req.path;

  sendErrorResponse(res, err, path, requestId);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string;

  logger.warn('Route not found:', {
    requestId,
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.path,
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
