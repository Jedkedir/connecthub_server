import compression from 'compression';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { env } from '../config/env.js';

export const securityMiddleware = [
  helmet(),
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: true
  }),
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.'
      }
    }
  }),
  mongoSanitize(),
  hpp(),
  compression()
];
