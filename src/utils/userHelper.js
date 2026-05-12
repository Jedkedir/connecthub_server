import mongoose from "mongoose";
import { User } from "../models/User.js";
import { FollowRequest } from "../models/FollowRequest.js";
import { Follow } from "../models/Follow.js";
export const hydrateUser = async (user, currentUser_id) => {
  if (!user) return user;

  // Ensure we are working with a plain object if it's a Mongoose document
  const userObj = user.toObject ? user.toObject() : user;

  const isFollowing = await Follow.exists({
    followerId: currentUser_id,
    followingId: user._id,
  });

  const pendingRequest = await FollowRequest.exists({
    requesterId: currentUser_id,
    targetId: user._id,
  });

  return {
    ...userObj, 
    isFollowing: !!isFollowing,
    isPending: !!pendingRequest,
  };
};
