import mongoose from 'mongoose';
import {User} from '../models/User.js';
import { FollowRequest } from '../models/FollowRequest.js';
export const hydrateFollowInteractions = async (userIds,currentUser) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }
  const Ids = userIds.map(id => new mongoose.Types.ObjectId(id).toString());
  const users = await User.find({ _id: { $in: Ids } }).select('username email profilePic followingCount followersCount').lean();
  if (!users || users.length === 0) {
    console.log('Users not found for IDs:', Ids);
    return [];
  }
  // Add isFollowing field to each user
  const currentUserFollowing = currentUser?.following || [];
  // Check if the current user has sent follow requests to these users
  const followRequests = await FollowRequest.find({
    requesterId: currentUser?._id,
    targetId: { $in: Ids }
  });

  return users.map(user => {
    const u = user.toObject?.() || user;
    return {
      ...u,
      isFollowing: currentUserFollowing.includes(u._id.toString()),
      isPending: followRequests.some(req => req.targetId.toString() === u._id.toString())
    };
  });
};