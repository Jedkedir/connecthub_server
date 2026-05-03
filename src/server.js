import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { app } from './app.js';
import { logger } from './utils/logger.js';

let server;

const start = async () => {
  await connectDatabase();

  server = app.listen(env.port, () => {
    logger.info('ConnectHub API listening', { port: env.port, environment: env.nodeEnv });
  });
};

const shutdown = async (signal) => {
  logger.warn('Shutdown signal received', { signal });

  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    return;
  }

  await disconnectDatabase();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

start().catch((error) => {
  logger.error('Failed to start server', { error: error.message, stack: error.stack });
  process.exit(1);
});
