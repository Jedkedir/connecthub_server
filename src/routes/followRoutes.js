import { Router } from 'express';
import { followController } from '../controllers/followController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { followRequesterSchema, followTargetSchema } from '../validators/followValidators.js';

const router = Router();

router.use(authenticate);

router.post('/request', validate(followTargetSchema), followController.request);
router.post('/accept', validate(followRequesterSchema), followController.accept);
router.post('/reject', validate(followRequesterSchema), followController.reject);
router.post('/unfollow', validate(followTargetSchema), followController.unfollow);
router.get('/:id/followers', followController.getFollowers);
router.get('/:id/following', followController.getFollowing);
export default router;
