import { authService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Sends a standard authentication response with user and token data.
 * @param {import('express').Response} res - Express response object.
 * @param {number} statusCode - HTTP status code to send.
 * @param {{user: Object, accessToken: string, refreshToken: string}} result - Authentication result.
 * @returns {import('express').Response} JSON response.
 */
const authResponse = (res, statusCode, result) =>
  res.status(statusCode).json({
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });

/**
 * Handles authentication HTTP requests.
 */
export const authController = {
  /**
   * Registers a new account and returns user data plus access and refresh tokens.
   */
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    authResponse(res, 201, result);
  }),

  /**
   * Authenticates credentials and returns a new token pair.
   */
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    authResponse(res, 200, result);
  }),

  /**
   * Rotates a refresh token from the request body or cookies.
   */
  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken || req.cookies?.refreshToken);
    authResponse(res, 200, result);
  }),

  /**
   * Changes the authenticated user's password and returns fresh tokens.
   */
  changePassword: asyncHandler(async (req, res) => {
    const result = await authService.changePassword(req.user._id, req.body);
    authResponse(res, 200, result);
  })
};
