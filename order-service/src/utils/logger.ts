import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'order-service' },
  transports: [new winston.transports.Console()],
});

