import { Notification } from '../models/Notification.js';
import { buildCreatedAtCursorFilter } from '../utils/pagination.js';

export const notificationRepository = {
  create: (data) => Notification.create(data),
  findByRecipient: (recipientId, cursor, limit) =>
    Notification.find({ recipientId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('senderId', 'username profilePic')
      .populate('postId', 'content mediaUrls')
      .populate('commentId', 'content'),
  findOwnedById: (id, recipientId) => Notification.findOne({ _id: id, recipientId }),
  markRead: (id, recipientId) =>
    Notification.findOneAndUpdate({ _id: id, recipientId }, { isRead: true }, { new: true }),
  markAllRead: (recipientId) =>
    Notification.updateMany({ recipientId, isRead: false }, { isRead: true })
};
