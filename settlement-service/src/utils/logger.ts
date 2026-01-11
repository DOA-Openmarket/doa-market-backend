import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'settlement-service' },
  transports: [new winston.transports.Console()],
});

