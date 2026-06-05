import {
  createDomainEvent,
  NOTIFICATION_EVENTS,
  eventBus,
} from "../events/eventBus.js";
import { followRepository } from "../repositories/followRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";

/**
 * Prevents a user from following or requesting themselves.
 * @param {string} actorId - Acting user ID.
 * @param {string} targetId - Target user ID.
 * @returns {void}
 */
const ensureDifferentUsers = (actorId, targetId) => {
  if (actorId.toString() === targetId.toString()) {
    throw new AppError(
      "SELF_FOLLOW_NOT_ALLOWED",
      "You cannot follow yourself.",
      400,
    );
  }
};

/**
 * Loads a target user or raises the API not-found error.
 * @param {string} userId - Target user ID.
 * @returns {Promise<Object>} User profile.
 */
const ensureUserExists = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user)
    throw new AppError("USER_NOT_FOUND", "Target user not found.", 404);
  return user;
};

/**
 * Detects MongoDB duplicate-key errors from unique indexes.
 * @param {Error} error - Error thrown by Mongoose or MongoDB.
 * @returns {boolean} True when the error is a duplicate-key conflict.
 */
const isDuplicateKey = (error) => error?.code === 11000;

/**
 * Contains follow request and relationship business operations.
 */
export const followService = {
  /**
   * Sends a follow request and emits a recipient notification.
   */
  sendRequest: async (requesterId, targetUserId) => {
    ensureDifferentUsers(requesterId, targetUserId);
    await ensureUserExists(targetUserId);

    const existingFollow = await followRepository.findFollow(
      requesterId,
      targetUserId,
    );
    if (existingFollow) {
      throw new AppError(
        "FOLLOW_ALREADY_EXISTS",
        "You already follow this user.",
        409,
      );
    }

    try {
      const request = await followRepository.createRequest(
        requesterId,
        targetUserId,
      );
      eventBus.emit(
        NOTIFICATION_EVENTS.FOLLOW_REQUEST,
        createDomainEvent(NOTIFICATION_EVENTS.FOLLOW_REQUEST, {
          senderId: requesterId,
          recipientId: targetUserId,
        }),
      );
      return request;
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError(
          "FOLLOW_REQUEST_EXISTS",
          "A pending follow request already exists.",
          409,
        );
      }
      throw error;
    }
  },

  /**
   * Accepts a pending request, creates the follow relation, and updates counters.
   */
  acceptRequest: async (recipientId, requesterId) => {
    ensureDifferentUsers(recipientId, requesterId);

    const request = await followRepository.consumePendingRequest(
      requesterId,
      recipientId,
    );
    if (!request) {
      throw new AppError(
        "FOLLOW_REQUEST_NOT_FOUND",
        "Pending follow request not found.",
        404,
      );
    }

    let isNewFollow = false;
    try {
      await followRepository.createFollow(requesterId, recipientId);
      isNewFollow = true;
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }

    if (isNewFollow) {
      await userRepository.incrementFollowing(requesterId, 1);
      await userRepository.incrementFollowers(recipientId, 1);
    }

    eventBus.emit(
      NOTIFICATION_EVENTS.FOLLOW_ACCEPTED,
      createDomainEvent(NOTIFICATION_EVENTS.FOLLOW_ACCEPTED, {
        senderId: recipientId,
        recipientId: requesterId,
      }),
    );

    return {
      requesterId,
      recipientId,
      status: "accepted",
    };
  },

  /**
   * Rejects and removes a pending follow request.
   */
  rejectRequest: async (recipientId, requesterId) => {
    ensureDifferentUsers(recipientId, requesterId);
    const request = await followRepository.consumePendingRequest(
      requesterId,
      recipientId,
    );
    if (!request) {
      throw new AppError(
        "FOLLOW_REQUEST_NOT_FOUND",
        "Pending follow request not found.",
        404,
      );
    }
    return {
      requesterId,
      recipientId,
      status: "rejected",
    };
  },

  /**
   * Deletes an existing follow relationship and updates counters.
   */
  unfollow: async (followerId, targetUserId) => {
    ensureDifferentUsers(followerId, targetUserId);
    const deleted = await followRepository.deleteFollow(
      followerId,
      targetUserId,
    );
    if (!deleted) {
      throw new AppError(
        "FOLLOW_NOT_FOUND",
        "You do not follow this user.",
        404,
      );
    }

    await userRepository.incrementFollowing(followerId, -1);
    await userRepository.incrementFollowers(targetUserId, -1);
    return { unfollowed: true };
  },
  /**
   * Returns followers for a user with current relationship state.
   */
  getFollowers: async (userId) => {
    const followers = await followRepository.getFollowers(userId);
    return followers;
  },
  /**
   * Returns users followed by a user with current relationship state.
   */
  getFollowing: async (userId) => {
    const following = await followRepository.getFollowing(userId);
    return following;
  },
};
