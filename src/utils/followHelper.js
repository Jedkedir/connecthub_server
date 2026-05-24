import mongoose from "mongoose";
import { User } from "../models/User.js";
import { FollowRequest } from "../models/FollowRequest.js";
import { Follow } from "../models/Follow.js";

/**
 * Hydrates user profiles with contextual follow and pending statuses.
 * @param {string[]} userIds - IDs for followers or following users
 * @param {string} currentUserId - The current user's ID string
 * @returns {Promise<Array>} Hydrated user objects
 */
export const hydrateFollowInteractions = async (userIds, currentUserId) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  // 1. Force convert string IDs to true MongoDB ObjectIds
  const targetObjectIds = userIds.map((id) => new mongoose.Types.ObjectId(id));
  const currentObjectUserId = currentUserId
    ? new mongoose.Types.ObjectId(currentUserId)
    : null;

  // 2. Fetch target users as plain JavaScript objects
  const users = await User.find({ _id: { $in: targetObjectIds } })
    .select("fullname email profilePic followingCount followersCount")
    .lean();

  if (!users || users.length === 0) {
    return [];
  }

  // 3. Read following state from Follow relations (no denormalized user.following array)
  let followingSet = new Set();
  if (currentObjectUserId) {
    const followingRows = await Follow.find({
      followerId: currentObjectUserId,
      followingId: { $in: targetObjectIds },
    })
      .select("followingId")
      .lean();
    followingSet = new Set(
      followingRows.map((row) => row.followingId.toString()),
    );
  }

  // 4. Query using 'recipientId' with the ObjectId array
  let pendingSet = new Set();
  if (currentObjectUserId) {
    const followRequests = await FollowRequest.find({
      requesterId: currentObjectUserId,
      recipientId: { $in: targetObjectIds },
      status: "pending",
    }).lean();

    pendingSet = new Set(
      followRequests.map((req) => req.recipientId.toString()),
    );
  }

  // 5. Map fields directly into the plain user objects
  return users.map((user) => {
    const userIdStr = user._id.toString();
    return {
      ...user,
      isFollowing: followingSet.has(userIdStr),
      isPending: pendingSet.has(userIdStr),
    };
  });
};
