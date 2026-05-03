import { authService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const authResponse = (res, statusCode, result) =>
  res.status(statusCode).json({
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    authResponse(res, 201, result);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    authResponse(res, 200, result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken || req.cookies?.refreshToken);
    authResponse(res, 200, result);
  }),

  changePassword: asyncHandler(async (req, res) => {
    const result = await authService.changePassword(req.user._id, req.body);
    authResponse(res, 200, result);
  })
};
