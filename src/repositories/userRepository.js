import { User } from '../models/User.js';
import { hydrateUser } from '../utils/userHelper.js';
export const userRepository = {
  create: (data) => User.create(data),
  findById: async (id, currentUser_id) =>{ 
    const user = await User.findById(id)
    return await hydrateUser(user, currentUser_id);
  },
  findByIdWithPassword: (id) => User.findById(id).select('+password +refreshTokenHash'),
  findByEmailWithPassword: (email) => User.findOne({ email }).select('+password +refreshTokenHash'),
  findByUsernameOrEmail: (username, email) => User.findOne({ $or: [{ username }, { email }] }),
  updateById: (id, data) => User.findByIdAndUpdate(id, data, { new: true, runValidators: true }),
  updatePasswordAndRefreshToken: (id, password, refreshTokenHash) =>
    User.findByIdAndUpdate(id, { password, refreshTokenHash }, { new: true }),
  updateRefreshTokenHash: (id, refreshTokenHash) =>
    User.findByIdAndUpdate(id, { refreshTokenHash }, { new: true }),
  incrementFollowers: (id, amount) =>
    User.findByIdAndUpdate(id, { $inc: { followersCount: amount } }, { new: true }),
  incrementFollowing: (id, amount) =>
    User.findByIdAndUpdate(id, { $inc: { followingCount: amount } }, { new: true })
};
