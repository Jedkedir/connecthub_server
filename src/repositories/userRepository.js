import { User } from "../models/User.js";
import { hydrateUser } from "../utils/userHelper.js";

/**
 * Encapsulates user persistence queries and mutations.
 */
export const userRepository = {
  /**
   * Creates a user document.
   */
  create: (data) => User.create(data),
  /**
   * Finds a user by ID and hydrates relationship metadata.
   */
  findById: async (id, currentUser_id) => {
    const user = await User.findById(id);
    return await hydrateUser(user, currentUser_id);
  },
  /**
   * Finds a user by ID while selecting hidden password and refresh hash fields.
   */
  findByIdWithPassword: (id) =>
    User.findById(id).select("+password +refreshTokenHash"),
  /**
   * Finds a user by email while selecting authentication secrets.
   */
  findByEmailWithPassword: (email) =>
    User.findOne({ email }).select("+password +refreshTokenHash"),
  /**
   * Finds a user matching either username or email.
   */
  findByUsernameOrEmail: (username, email) =>
    User.findOne({ $or: [{ username }, { email }] }),
  /**
   * Finds a lean user profile by username.
   */
  findByUsername: (username) => User.findOne({ username }).lean(),
  /**
   * Searches usernames by escaped prefix with a bounded result limit.
   */
  searchByUsername: (query, limit) => {
    const escapedQuery = String(query)
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return User.find({
      username: { $regex: `^${escapedQuery}`, $options: "i" },
    })
      .select("_id username fullname profilePic bio")
      .sort({ username: 1 })
      .limit(limit)
      .lean();
  },
  /**
   * Finds username records for a list of usernames.
   */
  findByUsernames: (usernames) =>
    User.find({ username: { $in: usernames } })
      .select("_id username")
      .lean(),
  /**
   * Finds a user by normalized email.
   */
  findByEmail: (email) => User.findOne({ email }),
  /**
   * Updates a user and runs schema validators.
   */
  updateById: (id, data) =>
    User.findByIdAndUpdate(id, data, { new: true, runValidators: true }),
  /**
   * Updates password and refresh token hash together.
   */
  updatePasswordAndRefreshToken: (id, password, refreshTokenHash) =>
    User.findByIdAndUpdate(id, { password, refreshTokenHash }, { new: true }),
  /**
   * Updates the stored refresh token hash.
   */
  updateRefreshTokenHash: (id, refreshTokenHash) =>
    User.findByIdAndUpdate(id, { refreshTokenHash }, { new: true }),
  /**
   * Adjusts a user's follower counter.
   */
  incrementFollowers: (id, amount) =>
    User.findByIdAndUpdate(
      id,
      { $inc: { followersCount: amount } },
      { new: true },
    ),
  /**
   * Adjusts a user's following counter.
   */
  incrementFollowing: (id, amount) =>
    User.findByIdAndUpdate(
      id,
      { $inc: { followingCount: amount } },
      { new: true },
    ),
};
