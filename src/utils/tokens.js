import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Signs a short-lived access token for authenticated API calls.
 * @param {string} userId - User identifier stored as the token subject.
 * @returns {string} Signed JWT access token.
 */
export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn
  });

/**
 * Signs a long-lived refresh token for token rotation.
 * @param {string} userId - User identifier stored as the token subject.
 * @returns {string} Signed JWT refresh token.
 */
export const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });

/**
 * Verifies and decodes an access token.
 * @param {string} token - JWT access token.
 * @returns {Object} Decoded token payload.
 */
export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);

/**
 * Verifies and decodes a refresh token.
 * @param {string} token - JWT refresh token.
 * @returns {Object} Decoded token payload.
 */
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
