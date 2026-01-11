import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'review-service' },
  transports: [new winston.transports.Console()],
});

