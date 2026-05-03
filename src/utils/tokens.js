import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn
  });

export const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
