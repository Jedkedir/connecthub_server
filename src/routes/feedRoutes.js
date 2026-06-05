import { Router } from 'express';
import { feedController } from '../controllers/feedController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { feedQuerySchema } from '../validators/feedValidators.js';

const router = Router();

/**
 * Feed routes require authentication before resolving feed queries.
 */
router.use(authenticate);

router.get('/personalized', validate(feedQuerySchema, 'query'), feedController.personalized);
router.get('/global', validate(feedQuerySchema, 'query'), feedController.global);
router.get('/explore', validate(feedQuerySchema, 'query'), feedController.explore);

export default router;
