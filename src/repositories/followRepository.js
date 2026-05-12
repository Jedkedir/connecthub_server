import { Follow } from '../models/Follow.js';
import { FollowRequest } from '../models/FollowRequest.js';
import {hydrateFollowInteractions} from '../utils/followHelper.js'

export const followRepository = {
  findFollow: (followerId, followingId) => Follow.findOne({ followerId, followingId }),
  createFollow: (followerId, followingId) => Follow.create({ followerId, followingId }),
  deleteFollow: (followerId, followingId) => Follow.findOneAndDelete({ followerId, followingId }),
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
    return hydrateFollowInteractions(followerIds);
  },
  getFollowing: async (userId) => {
    const following = await Follow.find({ followerId: userId }).select('followingId').lean();
    const followingIds = following.map((f) => f.followingId);
    return hydrateFollowInteractions(followingIds);
  }
};
