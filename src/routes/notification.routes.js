import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paginationQuery } from '../validators/commonValidators.js';

const router = Router();

/**
 * Notification routes require authentication before reading or mutating records.
 */
router.use(authenticate);

router.get('/', validate(paginationQuery, 'query'), notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
