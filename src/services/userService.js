import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { hydrateUser } from "../utils/userHelper.js";
import { getLimit } from "../utils/pagination.js";

export const userService = {
  getCurrentUser: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("USER_NOT_FOUND", "User not found.", 404);
    return user;
  },

  getUserById: async (id, currentUserId) => {
    const user = await userRepository.findById(id, currentUserId);
    if (!user) throw new AppError("USER_NOT_FOUND", "User not found.", 404);
    return user;
  },

  updateProfile: async (userId, data) => {
    const allowed = {};
    for (const key of ["fullname", "bio", "profilePic"]) {
      if (data[key] !== undefined) allowed[key] = data[key];
    }
    const user = await userRepository.updateById(userId, allowed);
    if (!user) throw new AppError("USER_NOT_FOUND", "User not found.", 404);
    return user;
  },

  searchUsers: async (currentUserId, query) => {
    const limit = getLimit(query.limit, 5, 5);
    const searchQuery = String(query.q || "")
      .trim()
      .replace(/^@/, "");
    if (!searchQuery) return [];

    const users = await userRepository.searchByUsername(searchQuery, limit);
    return Promise.all(users.map((user) => hydrateUser(user, currentUserId)));
  },

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
