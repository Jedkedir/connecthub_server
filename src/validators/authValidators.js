import Joi from "joi";

/**
 * Shared password rule for registration and password changes.
 */
const password = Joi.string().min(8).max(128).required();

/**
 * Validates account registration payloads.
 */
export const registerSchema = Joi.object({
  fullname: Joi.string()
    .regex(/^[a-zA-Z ]+$/)
    .min(3)
    .max(30)
    .required(),
  email: Joi.string().email().required(),
  password,
  bio: Joi.string().max(280).allow("").optional(),
  profilePic: Joi.string().uri().allow("").optional(),
});

/**
 * Validates login credentials.
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Validates refresh-token rotation payloads.
 */
export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

/**
 * Validates password change payloads and requires a new password value.
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: password.invalid(Joi.ref("currentPassword")).messages({
    "any.invalid": "newPassword must be different from currentPassword",
  }),
});
