import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { FollowRequest } from "../models/FollowRequest.js";
import { Follow } from "../models/Follow.js";

/**
 * Adds current-user follow, pending request, and post-count metadata to a user.
 * @param {Object|null} user - Mongoose user document or plain user object.
 * @param {string} currentUser_id - Current user used to compute relationship state.
 * @returns {Promise<Object|null>} Hydrated user profile.
 */
export const hydrateUser = async (user, currentUser_id) => {
  if (!user) return user;

  const userObj = user.toObject ? user.toObject() : user;

  const isFollowing = await Follow.exists({
    followerId: currentUser_id,
    followingId: user._id,
  });

  const pendingRequest = await FollowRequest.exists({
    requesterId: currentUser_id,
    recipientId: user._id,
    status: "pending",
  });
  const postCount = await Post.countDocuments({ authorId: user._id });
  return {
    ...userObj,
    isFollowing: !!isFollowing,
    isPending: !!pendingRequest,
    postCount: postCount,
  };
};
