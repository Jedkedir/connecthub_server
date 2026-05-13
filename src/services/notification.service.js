import { NOTIFICATION_EVENTS, eventBus } from '../events/eventBus.js';
import { interactionRepository } from '../repositories/interactionRepository.js';
import { postRepository } from '../repositories/postRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { getLimit } from '../utils/pagination.js';
import { postService } from './postService.js';
import { emitNotification } from '../loaders/socket.js';

let listenersInitialized = false;

const isSelfNotification = (senderId, recipientId) =>
  senderId?.toString() === recipientId?.toString();

const isDuplicateKey = (error) => error?.code === 11000;

const createNotification = async ({
  recipientId,
  senderId,
  type,
  postId,
  commentId,
  message,
  dedupeKey
}) => {
  if (!recipientId || !senderId || isSelfNotification(senderId, recipientId)) return null;

  if (postId) {
    const post = await postRepository.findByIdRaw(postId);
    if (!post) return null;
  }

  if (commentId) {
    const comment = await interactionRepository.findCommentById(commentId);
    if (!comment) return null;
  }

  try {
    const notification = await notificationRepository.create({
      recipientId,
      senderId,
      type,
      postId,
      commentId,
      message,
      isRead: false,
      dedupeKey
    });

    emitNotification(recipientId, notification);
    return notification;
  } catch (error) {
    if (isDuplicateKey(error)) return null;
    throw error;
  }
};

const runListener = (eventName, handler) => {
  eventBus.on(eventName, (event) => {
    Promise.resolve(handler(event.data ?? event)).catch((error) => {
      logger.error('Notification event handler failed', {
        eventName,
        error: error.message,
        stack: error.stack
      });
    });
  });
};

export const initializeNotificationListeners = () => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  runListener(NOTIFICATION_EVENTS.POST_LIKED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: 'LIKE',
      postId: data.postId,
      message: 'liked your post',
      dedupeKey: `LIKE:${data.senderId}:${data.recipientId}:${data.postId}`
    })
  );

  runListener(NOTIFICATION_EVENTS.POST_COMMENTED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: 'COMMENT',
      postId: data.postId,
      commentId: data.commentId,
      message: 'commented on your post',
      dedupeKey: `COMMENT:${data.commentId}`
    })
  );

  runListener(NOTIFICATION_EVENTS.COMMENT_REPLIED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: 'COMMENT',
      postId: data.postId,
      commentId: data.commentId,
      message: 'replied to your comment',
      dedupeKey: `COMMENT_REPLY:${data.commentId}`
    })
  );

  runListener(NOTIFICATION_EVENTS.COMMENT_LIKED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: 'LIKE',
      postId: data.postId,
      commentId: data.commentId,
      message: 'liked your comment',
      dedupeKey: `COMMENT_LIKE:${data.senderId}:${data.recipientId}:${data.commentId}`
    })
  );

  runListener(NOTIFICATION_EVENTS.FOLLOW_REQUEST, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: 'FOLLOW_REQUEST',
      message: 'sent you a follow request',
      dedupeKey: `FOLLOW_REQUEST:${data.senderId}:${data.recipientId}`
    })
  );

  runListener(NOTIFICATION_EVENTS.FOLLOW_ACCEPTED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: 'FOLLOW_ACCEPTED',
      message: 'accepted your follow request',
      dedupeKey: `FOLLOW_ACCEPTED:${data.senderId}:${data.recipientId}`
    })
  );
};

export const notificationService = {
  getNotifications: async (userId, query) => {
    const limit = getLimit(query.limit, 50, 50);
    const notifications = await notificationRepository.findByRecipient(userId, query.cursor, limit);
    return postService.toPaginationResult(notifications, limit);
  },

  markRead: async (userId, notificationId) => {
    const notification = await notificationRepository.markRead(notificationId, userId);
    if (!notification) {
      throw new AppError('NOTIFICATION_NOT_FOUND', 'Notification not found.', 404);
    }
    return notification;
  },

  markAllRead: async (userId) => {
    const result = await notificationRepository.markAllRead(userId);
    return { modifiedCount: result.modifiedCount };
  },
  deleteNotification: async (userId, notificationId) => {
    const result = await notificationRepository.deleteNotification(notificationId, userId);
    if (result.deletedCount === 0) {
      throw new AppError('NOTIFICATION_NOT_FOUND', 'Notification not found.', 404);
    }
    return;
  }
};
