import { userService } from '../services/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userController = {
  me: asyncHandler(async (req, res) => {
    const user = await userService.getCurrentUser(req.user._id);
    res.json({ data: { user } });
  }),

  getById: asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.json({ data: { user } });
  }),

  update: asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.json({ data: { user } });
  })
};
