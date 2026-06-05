import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  usernameParamSchema,
  updateProfileSchema,
  userSearchSchema,
} from "../validators/userValidators.js";

const router = Router();

/**
 * User routes require authentication before profile reads or updates.
 */
router.use(authenticate);

router.get(
  "/search",
  validate(userSearchSchema, "query"),
  userController.search,
);
router.get(
  "/search/username/:username",
  validate(usernameParamSchema, "params"),
  userController.searchByUsername,
);
router.get("/me", userController.me);
router.get("/:id", userController.getById);
router.put("/update", validate(updateProfileSchema), userController.update);

export default router;
