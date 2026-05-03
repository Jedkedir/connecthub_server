import { Router } from 'express';
import authRoutes from './authRoutes.js';
import feedRoutes from './feedRoutes.js';
import followRoutes from './followRoutes.js';
import postRoutes from './postRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/feed', feedRoutes);
router.use('/follow', followRoutes);

export default router;
