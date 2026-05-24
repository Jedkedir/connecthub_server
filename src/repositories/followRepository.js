import { Follow } from "../models/Follow.js";
import { FollowRequest } from "../models/FollowRequest.js";
import { hydrateFollowInteractions } from "../utils/followHelper.js";

const deleteFollowRequest = async (requesterId, recipientId) => {
  await FollowRequest.findOneAndDelete({
    requesterId,
    recipientId,
    status: "pending",
  });
};

export const followRepository = {
  findFollow: (followerId, followingId) => {
    return Follow.findOne({ followerId, followingId });
  },
  createFollow: async (followerId, followingId) => {
    const follow = await Follow.create({ followerId, followingId });
    // Delete any pending follow request between these users
    await deleteFollowRequest(followerId, followingId);
    return follow;
  },
  deleteFollow: async (followerId, followingId) => {
    const follow = await Follow.findOneAndDelete({ followerId, followingId });
    // Delete any pending follow request between these users
    await deleteFollowRequest(followerId, followingId);
    return follow;
  },
  findFollowingIds: async (followerId) => {
    const rows = await Follow.find({ followerId }).select("followingId").lean();
    return rows.map((row) => row.followingId);
  },
  createRequest: (requesterId, recipientId) =>
    FollowRequest.create({ requesterId, recipientId }),
  findPendingRequest: (requesterId, recipientId) =>
    FollowRequest.findOne({ requesterId, recipientId, status: "pending" }),
  consumePendingRequest: (requesterId, recipientId) =>
    FollowRequest.findOneAndDelete({
      requesterId,
      recipientId,
      status: "pending",
    }),
  getFollowers: async (userId) => {
    const followers = await Follow.find({ followingId: userId })
      .select("followerId")
      .lean();
    const followerIds = followers.map((f) => f.followerId);
    return hydrateFollowInteractions(followerIds, userId);
  },
  getFollowing: async (userId) => {
    const following = await Follow.find({ followerId: userId })
      .select("followingId")
      .lean();
    const followingIds = following.map((f) => f.followingId);
    return hydrateFollowInteractions(followingIds, userId);
  },
};
