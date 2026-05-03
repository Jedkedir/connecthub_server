import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/userValidators.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.me);
router.get('/:id', userController.getById);
router.put('/update', validate(updateProfileSchema), userController.update);

export default router;
