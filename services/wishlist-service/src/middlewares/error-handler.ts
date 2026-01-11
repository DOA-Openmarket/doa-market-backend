import { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal Server Error' });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'Route not found' });
};
