import { Router } from 'express';
import { interactionController } from '../controllers/interactionController.js';
import { postController } from '../controllers/postController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paginationQuery } from '../validators/commonValidators.js';
import { commentSchema, createPostSchema } from '../validators/postValidators.js';

const router = Router();

/**
 * Post and interaction routes require authentication.
 */
router.use(authenticate);

router.get('/bookmarks/me', validate(paginationQuery, 'query'), interactionController.bookmarks);
router.get('/liked/me', validate(paginationQuery, 'query'), interactionController.likedPosts);
router.get('/user/:userId', validate(paginationQuery, 'query'), postController.getByUser);
router.post('/', validate(createPostSchema), postController.create);
router.get('/:id', postController.getById);
router.delete('/:id', postController.delete);
router.post('/:id/like', interactionController.like);
router.post('/:id/unlike', interactionController.unlike);
router.post('/:id/comment', validate(commentSchema), interactionController.addComment);
router.post('/:id/comments', validate(commentSchema), interactionController.addComment);
router.get('/:id/comments', validate(paginationQuery, 'query'), interactionController.getComments);
router.post('/:id/bookmark', interactionController.bookmark);
router.delete('/:id/bookmark', interactionController.unbookmark);

/**
 * Comment reply and interaction routes.
 */
router.get('/comments/:commentId/replies', validate(paginationQuery, 'query'), interactionController.getReplies);
router.post('/comments/:commentId/like', interactionController.likeComment);
router.post('/comments/:commentId/unlike', interactionController.unlikeComment);
router.put('/comments/:commentId', validate(commentSchema), interactionController.updateComment);
router.delete('/comments/:commentId', interactionController.deleteComment);

export default router;
