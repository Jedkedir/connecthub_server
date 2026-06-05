import { Router } from 'express';
import authRoutes from './authRoutes.js';
import feedRoutes from './feedRoutes.js';
import followRoutes from './followRoutes.js';
import notificationRoutes from './notification.routes.js';
import postRoutes from './postRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

/**
 * Versioned API route registry.
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/feed', feedRoutes);
router.use('/follow', followRoutes);
router.use('/notifications', notificationRoutes);

export default router;
