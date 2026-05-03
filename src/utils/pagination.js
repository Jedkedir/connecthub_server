import { AppError } from './AppError.js';

export const getLimit = (value, fallback = 20, max = 50) => {
  const parsed = Number(value || fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

export const encodeCursor = (payload) =>
  Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

export const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new AppError('INVALID_CURSOR', 'Invalid pagination cursor.', 400);
  }
};

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

export const getCreatedAtCursorFromDoc = (doc) => {
  if (!doc) return null;
  return encodeCursor({ createdAt: doc.createdAt, id: doc._id });
};
