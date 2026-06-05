import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Opens the MongoDB connection using environment configuration.
 * @returns {Promise<void>}
 */
export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production'
  });

  logger.info('MongoDB connected', { database: mongoose.connection.name });
};

/**
 * Closes the active MongoDB connection.
 * @returns {Promise<void>}
 */
export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
