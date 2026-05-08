import { createDomainEvent, NOTIFICATION_EVENTS, eventBus } from '../events/eventBus.js';
import { followRepository } from '../repositories/followRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';

const ensureDifferentUsers = (actorId, targetId) => {
  if (actorId.toString() === targetId.toString()) {
    throw new AppError('SELF_FOLLOW_NOT_ALLOWED', 'You cannot follow yourself.', 400);
  }
};

const ensureUserExists = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'Target user not found.', 404);
  return user;
};

const isDuplicateKey = (error) => error?.code === 11000;

export const followService = {
  sendRequest: async (requesterId, targetUserId) => {
    ensureDifferentUsers(requesterId, targetUserId);
    await ensureUserExists(targetUserId);

    const existingFollow = await followRepository.findFollow(requesterId, targetUserId);
    if (existingFollow) {
      throw new AppError('FOLLOW_ALREADY_EXISTS', 'You already follow this user.', 409);
    }

    try {
      const request = await followRepository.createRequest(requesterId, targetUserId);
      eventBus.emit(
        NOTIFICATION_EVENTS.FOLLOW_REQUEST,
        createDomainEvent(NOTIFICATION_EVENTS.FOLLOW_REQUEST, {
          senderId: requesterId,
          recipientId: targetUserId
        })
      );
      return request;
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError('FOLLOW_REQUEST_EXISTS', 'A pending follow request already exists.', 409);
      }
      throw error;
    }
  },

  acceptRequest: async (recipientId, requesterId) => {
    ensureDifferentUsers(recipientId, requesterId);

    const request = await followRepository.updateRequestStatus(requesterId, recipientId, 'accepted');
    if (!request) {
      throw new AppError('FOLLOW_REQUEST_NOT_FOUND', 'Pending follow request not found.', 404);
    }

    try {
      await followRepository.createFollow(requesterId, recipientId);
      await userRepository.incrementFollowing(requesterId, 1);
      await userRepository.incrementFollowers(recipientId, 1);
    } catch (error) {
      if (isDuplicateKey(error)) return request;
      throw error;
    }

    eventBus.emit(
      NOTIFICATION_EVENTS.FOLLOW_ACCEPTED,
      createDomainEvent(NOTIFICATION_EVENTS.FOLLOW_ACCEPTED, {
        senderId: recipientId,
        recipientId: requesterId
      })
    );

    return request;
  },

  rejectRequest: async (recipientId, requesterId) => {
    ensureDifferentUsers(recipientId, requesterId);
    const request = await followRepository.updateRequestStatus(requesterId, recipientId, 'rejected');
    if (!request) {
      throw new AppError('FOLLOW_REQUEST_NOT_FOUND', 'Pending follow request not found.', 404);
    }
    return request;
  },

  unfollow: async (followerId, targetUserId) => {
    ensureDifferentUsers(followerId, targetUserId);
    const deleted = await followRepository.deleteFollow(followerId, targetUserId);
    if (!deleted) {
      throw new AppError('FOLLOW_NOT_FOUND', 'You do not follow this user.', 404);
    }

    await userRepository.incrementFollowing(followerId, -1);
    await userRepository.incrementFollowers(targetUserId, -1);
    return { unfollowed: true };
  }
};
