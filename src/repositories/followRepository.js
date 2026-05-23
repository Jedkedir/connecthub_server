import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';
import { FollowRequest } from '../models/FollowRequest.js';
import {hydrateFollowInteractions} from '../utils/followHelper.js'




const deleteFollowRequest = async (requesterId, recipientId) => {
  await FollowRequest.findOneAndDelete({ requesterId, recipientId, status: 'pending' });
};

export const followRepository = {
  findFollow: (followerId, followingId) => {
    return Follow.findOne({ followerId, followingId });
  },
  createFollow: (followerId, followingId) => {
    const follow = Follow.create({ followerId, followingId });
    // Delete any pending follow request between these users
    deleteFollowRequest(followerId, followingId);
    return follow;
  },
  deleteFollow: (followerId, followingId) => {
    const follow = Follow.findOneAndDelete({ followerId, followingId });
    // Delete any pending follow request between these users
    deleteFollowRequest(followerId, followingId);
    return follow;
  },
  findFollowingIds: async (followerId) => {
    const rows = await Follow.find({ followerId }).select('followingId').lean();
    return rows.map((row) => row.followingId);
  },
  createRequest: (requesterId, recipientId) => FollowRequest.create({ requesterId, recipientId }),
  findPendingRequest: (requesterId, recipientId) =>
    FollowRequest.findOne({ requesterId, recipientId, status: 'pending' }),
  updateRequestStatus: (requesterId, recipientId, status) =>
    FollowRequest.findOneAndUpdate(
      { requesterId, recipientId, status: 'pending' },
      { status },
      { new: true }
    ),
  getFollowers: async (userId) => {
    const followers = await Follow.find({ followingId: userId }).select('followerId').lean();
    const followerIds = followers.map((f) => f.followerId);
    return hydrateFollowInteractions(followerIds, userId);
  },
  getFollowing: async (userId) => {
    const following = await Follow.find({ followerId: userId }).select('followingId').lean();
    const followingIds = following.map((f) => f.followingId);
    return hydrateFollowInteractions(followingIds, userId);
  }
};
