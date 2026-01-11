import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'stats-service' },
  transports: [new winston.transports.Console()],
});

