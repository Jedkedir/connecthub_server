import { Notification } from "../models/Notification.js";
import { buildCreatedAtCursorFilter } from "../utils/pagination.js";

/**
 * Encapsulates notification persistence queries and mutations.
 */
export const notificationRepository = {
  /**
   * Creates a notification document.
   */
  create: (data) => Notification.create(data),
  /**
   * Finds paginated notifications for a recipient with related resources populated.
   */
  findByRecipient: (recipientId, cursor, limit) =>
    Notification.find({ recipientId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("senderId", "fullname username profilePic")
      .populate("postId", "content mediaUrls")
      .populate("commentId", "content"),
  /**
   * Finds one notification owned by a recipient.
   */
  findOwnedById: (id, recipientId) =>
    Notification.findOne({ _id: id, recipientId }),
  /**
   * Marks one owned notification as read.
   */
  markRead: (id, recipientId) =>
    Notification.findOneAndUpdate(
      { _id: id, recipientId },
      { isRead: true },
      { new: true },
    ),
  /**
   * Marks all unread notifications for a recipient as read.
   */
  markAllRead: (recipientId) =>
    Notification.updateMany({ recipientId, isRead: false }, { isRead: true }),
  /**
   * Deletes one owned notification.
   */
  deleteNotification: (notificationId, recipientId) =>
    Notification.deleteOne({ _id: notificationId, recipientId }),
};
