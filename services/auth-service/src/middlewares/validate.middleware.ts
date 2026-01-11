import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '@/utils/logger';

export class ValidationMiddleware {
  static validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        logger.warn('Validation error:', { errors, body: req.body });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }

      req.body = value;
      next();
    };
  };

  static validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        logger.warn('Parameter validation error:', { errors, params: req.params });

        res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors,
        });
        return;
      }

      req.params = value;
      next();
    };
  };

  static validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        logger.warn('Query validation error:', { errors, query: req.query });

        res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors,
        });
        return;
      }

      req.query = value;
      next();
    };
  };
}
