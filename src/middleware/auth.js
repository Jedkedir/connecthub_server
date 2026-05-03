import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new AppError('AUTH_REQUIRED', 'Authentication is required.', 401);
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError('INVALID_ACCESS_TOKEN', 'Access token is invalid or expired.', 401);
  }

  if (payload.type !== 'access') {
    throw new AppError('INVALID_ACCESS_TOKEN', 'Access token is invalid.', 401);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Authenticated user no longer exists.', 401);
  }

  req.user = user;
  next();
});
