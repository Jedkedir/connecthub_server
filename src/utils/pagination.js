import { AppError } from './AppError.js';

/**
 * Parses and clamps a caller-provided pagination limit.
 * @param {string|number|undefined} value - Raw limit from request input.
 * @param {number} [fallback=20] - Limit used when input is absent or invalid.
 * @param {number} [max=50] - Maximum allowed limit.
 * @returns {number} Safe limit value.
 */
export const getLimit = (value, fallback = 20, max = 50) => {
  const parsed = Number(value || fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

/**
 * Encodes cursor state as URL-safe base64 JSON.
 * @param {Object} payload - Cursor state to preserve between requests.
 * @returns {string} Encoded cursor.
 */
export const encodeCursor = (payload) =>
  Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

/**
 * Decodes a URL-safe cursor and rejects malformed input.
 * @param {string|undefined} cursor - Encoded cursor from a query string.
 * @returns {Object|null} Decoded cursor payload or null when absent.
 */
export const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new AppError('INVALID_CURSOR', 'Invalid pagination cursor.', 400);
  }
};

/**
 * Builds a MongoDB filter for descending createdAt/_id cursor pagination.
 * @param {string|undefined} cursor - Encoded cursor containing createdAt and id.
 * @returns {Object} MongoDB filter fragment.
 */
export const buildCreatedAtCursorFilter = (cursor) => {
  const decoded = decodeCursor(cursor);
  if (!decoded) return {};

  return {
    $or: [
      { createdAt: { $lt: new Date(decoded.createdAt) } },
      { createdAt: new Date(decoded.createdAt), _id: { $lt: decoded.id } }
    ]
  };
};

/**
 * Creates the next cursor from the last document in a page.
 * @param {Object|null} doc - Last returned document.
 * @returns {string|null} Encoded cursor or null when no document exists.
 */
export const getCreatedAtCursorFromDoc = (doc) => {
  if (!doc) return null;
  return encodeCursor({ createdAt: doc.createdAt, id: doc._id });
};
