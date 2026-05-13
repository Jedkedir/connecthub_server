import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationController = {
  getNotifications: asyncHandler(async (req, res) => {
    const result = await notificationService.getNotifications(req.user._id, req.query);
    res.json(result);
  }),

  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(req.user._id, req.params.id);
    res.json({ data: { notification } });
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const result = await notificationService.markAllRead(req.user._id);
    res.json({ data: result });
  }),
  deleteNotification: asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(req.user._id, req.params.id);
    res.json({ message: 'Notification deleted' });
  })
};
