export class AppError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

