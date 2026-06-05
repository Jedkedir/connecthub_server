import { Follow } from "../models/Follow.js";
import { FollowRequest } from "../models/FollowRequest.js";
import { hydrateFollowInteractions } from "../utils/followHelper.js";

/**
 * Removes a pending request between two users after a follow state changes.
 */
const deleteFollowRequest = async (requesterId, recipientId) => {
  await FollowRequest.findOneAndDelete({
    requesterId,
    recipientId,
    status: "pending",
  });
};

/**
 * Encapsulates follow and follow-request persistence operations.
 */
export const followRepository = {
  /**
   * Finds an existing follow relationship.
   */
  findFollow: (followerId, followingId) => {
    return Follow.findOne({ followerId, followingId });
  },
  /**
   * Creates a follow relationship and clears any matching pending request.
   */
  createFollow: async (followerId, followingId) => {
    const follow = await Follow.create({ followerId, followingId });
    await deleteFollowRequest(followerId, followingId);
    return follow;
  },
  /**
   * Deletes a follow relationship and clears any matching pending request.
   */
  deleteFollow: async (followerId, followingId) => {
    const follow = await Follow.findOneAndDelete({ followerId, followingId });
    await deleteFollowRequest(followerId, followingId);
    return follow;
  },
  /**
   * Returns IDs followed by a user.
   */
  findFollowingIds: async (followerId) => {
    const rows = await Follow.find({ followerId }).select("followingId").lean();
    return rows.map((row) => row.followingId);
  },
  /**
   * Creates a pending follow request.
   */
  createRequest: (requesterId, recipientId) =>
    FollowRequest.create({ requesterId, recipientId }),
  /**
   * Finds a pending follow request.
   */
  findPendingRequest: (requesterId, recipientId) =>
    FollowRequest.findOne({ requesterId, recipientId, status: "pending" }),
  /**
   * Atomically consumes a pending follow request.
   */
  consumePendingRequest: (requesterId, recipientId) =>
    FollowRequest.findOneAndDelete({
      requesterId,
      recipientId,
      status: "pending",
    }),
  /**
   * Returns hydrated followers for a user.
   */
  getFollowers: async (userId) => {
    const followers = await Follow.find({ followingId: userId })
      .select("followerId")
      .lean();
    const followerIds = followers.map((f) => f.followerId);
    return hydrateFollowInteractions(followerIds, userId);
  },
  /**
   * Returns hydrated accounts followed by a user.
   */
  getFollowing: async (userId) => {
    const following = await Follow.find({ followerId: userId })
      .select("followingId")
      .lean();
    const followingIds = following.map((f) => f.followingId);
    return hydrateFollowInteractions(followingIds, userId);
  },
};
