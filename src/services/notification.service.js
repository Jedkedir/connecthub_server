import { NOTIFICATION_EVENTS, eventBus } from "../events/eventBus.js";
import { interactionRepository } from "../repositories/interactionRepository.js";
import { postRepository } from "../repositories/postRepository.js";
import { notificationRepository } from "../repositories/notificationRepository.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { getLimit } from "../utils/pagination.js";
import { postService } from "./postService.js";
import { emitNotification } from "../loaders/socket.js";

let listenersInitialized = false;

/**
 * Checks whether a notification would target the same user that triggered it.
 * @param {string|Object} senderId - Event sender ID.
 * @param {string|Object} recipientId - Event recipient ID.
 * @returns {boolean} True when sender and recipient are the same user.
 */
const isSelfNotification = (senderId, recipientId) =>
  senderId?.toString() === recipientId?.toString();

/**
 * Detects MongoDB duplicate-key errors from unique notification dedupe keys.
 * @param {Error} error - Error thrown by Mongoose or MongoDB.
 * @returns {boolean} True when the error is a duplicate-key conflict.
 */
const isDuplicateKey = (error) => error?.code === 11000;

/**
 * Persists and emits a notification after validating referenced resources.
 * @param {Object} payload - Notification creation payload.
 * @returns {Promise<Object|null>} Created notification or null when skipped.
 */
const createNotification = async ({
  recipientId,
  senderId,
  type,
  postId,
  commentId,
  message,
  dedupeKey,
}) => {
  if (!recipientId || !senderId || isSelfNotification(senderId, recipientId))
    return null;

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
      dedupeKey,
    });

    emitNotification(recipientId, notification);
    return notification;
  } catch (error) {
    if (isDuplicateKey(error)) return null;
    throw error;
  }
};

/**
 * Registers one event listener and logs asynchronous handler failures.
 * @param {string} eventName - Domain event name.
 * @param {Function} handler - Event data handler.
 * @returns {void}
 */
const runListener = (eventName, handler) => {
  eventBus.on(eventName, (event) => {
    Promise.resolve(handler(event.data ?? event)).catch((error) => {
      logger.error("Notification event handler failed", {
        eventName,
        error: error.message,
        stack: error.stack,
      });
    });
  });
};

/**
 * Registers notification event listeners once for the process lifetime.
 * @returns {void}
 */
export const initializeNotificationListeners = () => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  runListener(NOTIFICATION_EVENTS.POST_LIKED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: "LIKE",
      postId: data.postId,
      message: "liked your post",
      dedupeKey: `LIKE:${data.senderId}:${data.recipientId}:${data.postId}`,
    }),
  );

  runListener(NOTIFICATION_EVENTS.POST_COMMENTED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: "COMMENT",
      postId: data.postId,
      commentId: data.commentId,
      message: "commented on your post",
      dedupeKey: `COMMENT:${data.commentId}`,
    }),
  );

  runListener(NOTIFICATION_EVENTS.POST_MENTIONED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: "MENTION",
      postId: data.postId,
      message: "mentioned you in a post",
      dedupeKey: `MENTION_POST:${data.senderId}:${data.recipientId}:${data.postId}`,
    }),
  );

  runListener(NOTIFICATION_EVENTS.COMMENT_REPLIED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: "COMMENT",
      postId: data.postId,
      commentId: data.commentId,
      message: "replied to your comment",
      dedupeKey: `COMMENT_REPLY:${data.commentId}`,
    }),
  );

  runListener(NOTIFICATION_EVENTS.COMMENT_MENTIONED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: "MENTION",
      postId: data.postId,
      commentId: data.commentId,
      message: "mentioned you in a comment",
      dedupeKey: `MENTION_COMMENT:${data.senderId}:${data.recipientId}:${data.commentId}`,
    }),
  );

  runListener(NOTIFICATION_EVENTS.COMMENT_LIKED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: "LIKE",
      postId: data.postId,
      commentId: data.commentId,
      message: "liked your comment",
      dedupeKey: `COMMENT_LIKE:${data.senderId}:${data.recipientId}:${data.commentId}`,
    }),
  );

  runListener(NOTIFICATION_EVENTS.FOLLOW_REQUEST, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: "FOLLOW_REQUEST",
      message: "sent you a follow request",
      dedupeKey: `FOLLOW_REQUEST:${data.senderId}:${data.recipientId}`,
    }),
  );

  runListener(NOTIFICATION_EVENTS.FOLLOW_ACCEPTED, (data) =>
    createNotification({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: "FOLLOW_ACCEPTED",
      message: "accepted your follow request",
      dedupeKey: `FOLLOW_ACCEPTED:${data.senderId}:${data.recipientId}`,
    }),
  );
};

/**
 * Contains notification retrieval and read-state business operations.
 */
export const notificationService = {
  /**
   * Returns paginated notifications for a recipient.
   */
  getNotifications: async (userId, query) => {
    const limit = getLimit(query.limit, 50, 50);
    const notifications = await notificationRepository.findByRecipient(
      userId,
      query.cursor,
      limit,
    );
    return postService.toPaginationResult(notifications, limit);
  },

  /**
   * Marks one owned notification as read.
   */
  markRead: async (userId, notificationId) => {
    const notification = await notificationRepository.markRead(
      notificationId,
      userId,
    );
    if (!notification) {
      throw new AppError(
        "NOTIFICATION_NOT_FOUND",
        "Notification not found.",
        404,
      );
    }
    return notification;
  },

  /**
   * Marks all unread notifications for a user as read.
   */
  markAllRead: async (userId) => {
    const result = await notificationRepository.markAllRead(userId);
    return { modifiedCount: result.modifiedCount };
  },
  /**
   * Deletes one owned notification.
   */
  deleteNotification: async (userId, notificationId) => {
    const result = await notificationRepository.deleteNotification(
      notificationId,
      userId,
    );
    if (result.deletedCount === 0) {
      throw new AppError(
        "NOTIFICATION_NOT_FOUND",
        "Notification not found.",
        404,
      );
    }
    return;
  },
};
