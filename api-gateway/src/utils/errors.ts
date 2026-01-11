import { Response } from 'express';
import logger from './logger';

export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  BAD_GATEWAY = 'BAD_GATEWAY',

  // Custom Business Errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
    requestId?: string;
  };
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(ErrorCode.BAD_REQUEST, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found', details?: any) {
    super(ErrorCode.NOT_FOUND, message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', details?: any) {
    super(ErrorCode.CONFLICT, message, 409, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error', details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 422, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable', details?: any) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, 503, details);
  }
}

export function formatErrorResponse(
  error: AppError | Error,
  path?: string,
  requestId?: string
): ErrorResponse {
  const isAppError = error instanceof AppError;

  return {
    success: false,
    error: {
      code: isAppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR,
      message: error.message,
      details: isAppError ? error.details : undefined,
      timestamp: new Date().toISOString(),
      path,
      requestId,
    },
  };
}

export function sendErrorResponse(
  res: Response,
  error: AppError | Error,
  path?: string,
  requestId?: string
) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const errorResponse = formatErrorResponse(error, path, requestId);

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      error: errorResponse,
      stack: error.stack,
    });
  } else {
    logger.warn('Client error:', errorResponse);
  }

  res.status(statusCode).json(errorResponse);
}
