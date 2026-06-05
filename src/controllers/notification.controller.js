import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Handles notification retrieval, read state, and deletion HTTP requests.
 */
export const notificationController = {
  /**
   * Returns paginated notifications for the authenticated user.
   */
  getNotifications: asyncHandler(async (req, res) => {
    const result = await notificationService.getNotifications(req.user._id, req.query);
    res.json(result);
  }),

  /**
   * Marks one notification as read when owned by the authenticated user.
   */
  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(req.user._id, req.params.id);
    res.json({ data: { notification } });
  }),

  /**
   * Marks every unread notification for the authenticated user as read.
   */
  markAllRead: asyncHandler(async (req, res) => {
    const result = await notificationService.markAllRead(req.user._id);
    res.json({ data: result });
  }),
  /**
   * Deletes one notification when owned by the authenticated user.
   */
  deleteNotification: asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(req.user._id, req.params.id);
    res.json({ message: 'Notification deleted' });
  })
};
