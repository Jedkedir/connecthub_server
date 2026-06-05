import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { hydrateUser } from "../utils/userHelper.js";
import { getLimit } from "../utils/pagination.js";

/**
 * Contains user profile and lookup business operations.
 */
export const userService = {
  /**
   * Fetches the authenticated user's profile.
   * @param {string} userId - Authenticated user ID.
   * @returns {Promise<Object>} User profile.
   */
  getCurrentUser: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("USER_NOT_FOUND", "User not found.", 404);
    return user;
  },

  /**
   * Fetches a user by id with relationship metadata for the current user.
   * @param {string} id - Target user ID.
   * @param {string} currentUserId - Authenticated user ID.
   * @returns {Promise<Object>} Hydrated user profile.
   */
  getUserById: async (id, currentUserId) => {
    const user = await userRepository.findById(id, currentUserId);
    if (!user) throw new AppError("USER_NOT_FOUND", "User not found.", 404);
    return user;
  },

  /**
   * Updates only profile fields allowed by the API contract.
   * @param {string} userId - Authenticated user ID.
   * @param {Object} data - Requested profile changes.
   * @returns {Promise<Object>} Updated user profile.
   */
  updateProfile: async (userId, data) => {
    const allowed = {};
    for (const key of ["fullname", "bio", "profilePic"]) {
      if (data[key] !== undefined) allowed[key] = data[key];
    }
    const user = await userRepository.updateById(userId, allowed);
    if (!user) throw new AppError("USER_NOT_FOUND", "User not found.", 404);
    return user;
  },

  /**
   * Searches users by username prefix and hydrates relationship state.
   * @param {string} currentUserId - Authenticated user ID.
   * @param {Object} query - Search query object.
   * @returns {Promise<Object[]>} Matching hydrated users.
   */
  searchUsers: async (currentUserId, query) => {
    const limit = getLimit(query.limit, 5, 5);
    const searchQuery = String(query.q || "")
      .trim()
      .replace(/^@/, "");
    if (!searchQuery) return [];

    const users = await userRepository.searchByUsername(searchQuery, limit);
    return Promise.all(users.map((user) => hydrateUser(user, currentUserId)));
  },

  /**
   * Finds one profile by username after removing any leading @ symbol.
   * @param {string} currentUserId - Authenticated user ID.
   * @param {string} username - Username route parameter.
   * @returns {Promise<Object|null>} Hydrated user profile or null.
   */
  getUserByUsername: async (currentUserId, username) => {
    const normalizedUsername = String(username || "")
      .trim()
      .replace(/^@/, "");
    if (!normalizedUsername) {
      return null;
    }

    const user = await userRepository.findByUsername(normalizedUsername);
    if (!user) return null;

    return hydrateUser(user, currentUserId);
  },
};
