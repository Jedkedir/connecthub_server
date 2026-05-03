import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

const normalizeEmail = (email) => email.toLowerCase().trim();
const normalizeUsername = (username) => username.toLowerCase().trim();

const buildTokenPayload = async (userId) => {
  const accessToken = signAccessToken(userId.toString());
  const refreshToken = signRefreshToken(userId.toString());
  const refreshTokenHash = await bcrypt.hash(refreshToken, env.bcryptSaltRounds);
  await userRepository.updateRefreshTokenHash(userId, refreshTokenHash);

  return { accessToken, refreshToken };
};

export const authService = {
  register: async ({ username, email, password, bio, profilePic }) => {
    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = normalizeEmail(email);

    const existing = await userRepository.findByUsernameOrEmail(normalizedUsername, normalizedEmail);
    if (existing) {
      throw new AppError('USER_ALREADY_EXISTS', 'Username or email is already registered.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);
    const user = await userRepository.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      bio,
      profilePic
    });

    const tokens = await buildTokenPayload(user._id);
    return { user, ...tokens };
  },

  login: async ({ email, password }) => {
    const user = await userRepository.findByEmailWithPassword(normalizeEmail(email));
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    const tokens = await buildTokenPayload(user._id);
    return { user, ...tokens };
  },

  refresh: async (refreshToken) => {
    if (!refreshToken) {
      throw new AppError('REFRESH_TOKEN_REQUIRED', 'Refresh token is required.', 401);
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.', 401);
    }

    if (payload.type !== 'refresh') {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token is invalid.', 401);
    }

    const user = await userRepository.findByIdWithPassword(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token is no longer valid.', 401);
    }

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatches) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token is no longer valid.', 401);
    }

    const tokens = await buildTokenPayload(user._id);
    return { user, ...tokens };
  },

  changePassword: async (userId, { currentPassword, newPassword }) => {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      throw new AppError('INVALID_CREDENTIALS', 'Current password is incorrect.', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    const refreshToken = signRefreshToken(user._id.toString());
    const refreshTokenHash = await bcrypt.hash(refreshToken, env.bcryptSaltRounds);
    const updatedUser = await userRepository.updatePasswordAndRefreshToken(
      user._id,
      hashedPassword,
      refreshTokenHash
    );

    return {
      user: updatedUser,
      accessToken: signAccessToken(user._id.toString()),
      refreshToken
    };
  }
};
