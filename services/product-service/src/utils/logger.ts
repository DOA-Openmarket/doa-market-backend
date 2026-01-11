import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: logLevel,
  }),
];

// Add CloudWatch transport in production
if (process.env.NODE_ENV === 'production' && process.env.CLOUDWATCH_LOG_GROUP) {
  transports.push(
    new WinstonCloudWatch({
      logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
      logStreamName: `${process.env.SERVICE_NAME}-${new Date().toISOString().split('T')[0]}`,
      awsRegion: process.env.AWS_REGION || 'ap-northeast-2',
      messageFormatter: ({ level, message, ...meta }) => {
        return JSON.stringify({ level, message, ...meta });
      },
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan HTTP logger
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
