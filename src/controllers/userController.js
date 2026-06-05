import { userService } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Handles user profile and search HTTP requests.
 */
export const userController = {
  /**
   * Searches users by query string and hydrates relationship metadata.
   */
  search: asyncHandler(async (req, res) => {
    const users = await userService.searchUsers(req.user._id, req.query);
    res.json({ data: { users } });
  }),

  /**
   * Fetches one user by username for profile lookup.
   */
  searchByUsername: asyncHandler(async (req, res) => {
    const user = await userService.getUserByUsername(
      req.user._id,
      req.params.username,
    );
    res.json({ data: { user } });
  }),

  /**
   * Returns the authenticated user's profile.
   */
  me: asyncHandler(async (req, res) => {
    const user = await userService.getCurrentUser(req.user._id);
    res.json({ data: { user } });
  }),

  /**
   * Returns a user profile by MongoDB identifier.
   */
  getById: asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id, req.user._id);
    res.json({ data: { user } });
  }),

  /**
   * Updates allowed profile fields for the authenticated user.
   */
  update: asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.json({ data: { user } });
  }),
};
