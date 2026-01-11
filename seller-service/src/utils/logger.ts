import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'seller-service' },
  transports: [new winston.transports.Console()],
});

