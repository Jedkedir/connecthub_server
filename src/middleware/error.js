import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * Converts framework and database errors into API-safe AppError instances.
 * @param {Error} error - Raw thrown error.
 * @returns {AppError} Normalized application error.
 */
const normalizeError = (error) => {
  if (error instanceof AppError) return error;

  if (error instanceof mongoose.Error.CastError) {
    return new AppError('INVALID_ID', 'Invalid resource identifier.', 400);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return new AppError('VALIDATION_ERROR', error.message, 400);
  }

  if (error?.code === 11000) {
    return new AppError('DUPLICATE_RESOURCE', 'A resource with these values already exists.', 409);
  }

  return new AppError('INTERNAL_SERVER_ERROR', 'Something went wrong.', 500);
};

/**
 * Handles unmatched routes by forwarding a not-found AppError.
 */
export const notFoundHandler = (req, _res, next) => {
  next(new AppError('ROUTE_NOT_FOUND', `Route ${req.originalUrl} was not found.`, 404));
};

/**
 * Logs and serializes errors into the public API error response shape.
 */
export const errorHandler = (error, req, res, _next) => {
  const normalized = normalizeError(error);

  logger.error(normalized.message, {
    code: normalized.code,
    statusCode: normalized.statusCode,
    method: req.method,
    path: req.originalUrl,
    stack: env.nodeEnv === 'production' ? undefined : error.stack
  });

  res.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message
    }
  });
};
