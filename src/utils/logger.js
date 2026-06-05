import winston from 'winston';
import morgan from 'morgan';

const { combine, timestamp, printf, json, errors } = winston.format;

const logFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
  exitOnError: false
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(timestamp(), printf(({ timestamp, level, message, stack, ...meta }) => {
      const base = `${timestamp} ${level}: ${stack || message}`;
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return base + metaStr;
    }))
  }));
}

/**
 * Express middleware that forwards Morgan HTTP logs to Winston.
 */
const morganMiddleware = morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
});

export { logger, morganMiddleware };
