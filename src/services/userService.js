import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';

export const userService = {
  getCurrentUser: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
    return user;
  },

  getUserById: async (id, currentUserId) => {
    const user = await userRepository.findById(id, currentUserId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
    return user;
  },

  updateProfile: async (userId, data) => {
    const allowed = {};
    for (const key of ['username','bio', 'profilePic']) {
      if (data[key] !== undefined) allowed[key] = data[key];
    }
    const user = await userRepository.updateById(userId, allowed);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
    return user;
  }
};
