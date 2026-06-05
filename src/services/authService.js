import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";

/**
 * Lowercases and trims an email address before storage or lookup.
 * @param {string} email - Raw email.
 * @returns {string} Normalized email.
 */
const normalizeEmail = (email) => email.toLowerCase().trim();

/**
 * Lowercases and trims a display name before storage.
 * @param {string} fullname - Raw full name.
 * @returns {string} Normalized full name.
 */
const normalizeFullname = (fullname) => fullname.toLowerCase().trim();

/**
 * Creates a new token pair and persists the hashed refresh token.
 * @param {Object} userId - User MongoDB identifier.
 * @returns {Promise<{accessToken: string, refreshToken: string}>} Signed token pair.
 */
const buildTokenPayload = async (userId) => {
  const accessToken = signAccessToken(userId.toString());
  const refreshToken = signRefreshToken(userId.toString());
  const refreshTokenHash = await bcrypt.hash(
    refreshToken,
    env.bcryptSaltRounds,
  );
  await userRepository.updateRefreshTokenHash(userId, refreshTokenHash);

  return { accessToken, refreshToken };
};

/**
 * Contains authentication business operations.
 */
export const authService = {
  /**
   * Registers a user, hashes their password, and returns authentication tokens.
   * @param {Object} payload - Registration payload.
   * @returns {Promise<Object>} Created user plus token pair.
   */
  register: async ({ fullname, email, password, bio, profilePic }) => {
    const normalizedFullname = normalizeFullname(fullname);
    const normalizedEmail = normalizeEmail(email);

    const existing = await userRepository.findByEmail(
      normalizedEmail,
    );
    if (existing) {
      throw new AppError(
        "USER_ALREADY_EXISTS",
        "Email is already registered.",
        409,
      );
    }

    const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);
    const user = await userRepository.create({
      fullname: normalizedFullname,
      email: normalizedEmail,
      password: hashedPassword,
      bio,
      profilePic,
    });

    const tokens = await buildTokenPayload(user._id);
    return { user, ...tokens };
  },

  /**
   * Verifies credentials and returns a fresh token pair.
   * @param {Object} credentials - Login credentials.
   * @returns {Promise<Object>} Authenticated user plus token pair.
   */
  login: async ({ email, password }) => {
    const user = await userRepository.findByEmailWithPassword(
      normalizeEmail(email),
    );
    if (!user) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "Invalid email or password.",
        401,
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "Invalid email or password.",
        401,
      );
    }

    const tokens = await buildTokenPayload(user._id);
    return { user, ...tokens };
  },

  /**
   * Validates a refresh token, checks it against the stored hash, and rotates tokens.
   * @param {string} refreshToken - Raw refresh token.
   * @returns {Promise<Object>} User plus rotated token pair.
   */
  refresh: async (refreshToken) => {
    if (!refreshToken) {
      throw new AppError(
        "REFRESH_TOKEN_REQUIRED",
        "Refresh token is required.",
        401,
      );
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(
        "INVALID_REFRESH_TOKEN",
        "Refresh token is invalid or expired.",
        401,
      );
    }

    if (payload.type !== "refresh") {
      throw new AppError(
        "INVALID_REFRESH_TOKEN",
        "Refresh token is invalid.",
        401,
      );
    }

    const user = await userRepository.findByIdWithPassword(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new AppError(
        "INVALID_REFRESH_TOKEN",
        "Refresh token is no longer valid.",
        401,
      );
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!tokenMatches) {
      throw new AppError(
        "INVALID_REFRESH_TOKEN",
        "Refresh token is no longer valid.",
        401,
      );
    }

    const tokens = await buildTokenPayload(user._id);
    return { user, ...tokens };
  },

  /**
   * Changes a user's password after verifying the current password.
   * @param {Object} userId - Authenticated user's MongoDB identifier.
   * @param {Object} payload - Password change payload.
   * @returns {Promise<Object>} Updated user plus new token pair.
   */
  changePassword: async (userId, { currentPassword, newPassword }) => {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new AppError("USER_NOT_FOUND", "User not found.", 404);
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!passwordMatches) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "Current password is incorrect.",
        401,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    const refreshToken = signRefreshToken(user._id.toString());
    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      env.bcryptSaltRounds,
    );
    const updatedUser = await userRepository.updatePasswordAndRefreshToken(
      user._id,
      hashedPassword,
      refreshTokenHash,
    );

    return {
      user: updatedUser,
      accessToken: signAccessToken(user._id.toString()),
      refreshToken,
    };
  },
};
