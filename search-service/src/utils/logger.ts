import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'search-service' },
  transports: [new winston.transports.Console()],
});

