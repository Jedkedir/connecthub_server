import cookieParser from 'cookie-parser';
import express from 'express';
import morgan from 'morgan';
import { env } from '../config/env.js';
import { errorHandler, notFoundHandler } from '../middleware/error.js';
import { securityMiddleware } from '../middleware/security.js';
import routes from '../routes/index.js';
import { logger } from '../utils/logger.js';

/**
 * Creates and configures the Express application pipeline.
 * @returns {import('express').Express} Configured Express app.
 */
export const createExpressApp = () => {
  const app = express();

  app.use(securityMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  if (env.nodeEnv !== 'test') {
    app.use(
      morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim())
        }
      })
    );
  }

  /**
   * Reports process health for uptime checks.
   */
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
