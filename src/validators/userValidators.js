import Joi from "joi";

/**
 * Validates profile update payloads and requires at least one field.
 */
export const updateProfileSchema = Joi.object({
  fullname: Joi.string()
    .regex(/^[a-zA-Z ]+$/)
    .min(3)
    .max(30)
    .optional(),
  bio: Joi.string().max(280).allow("").optional(),
  profilePic: Joi.string().uri().allow("").optional(),
}).min(1);

/**
 * Validates user search query parameters.
 */
export const userSearchSchema = Joi.object({
  query: Joi.string().trim().min(1).max(50).required(),
  limit: Joi.number().integer().min(1).max(5).optional(),
});

/**
 * Validates username route parameters.
 */
export const usernameParamSchema = Joi.object({
  username: Joi.string().trim().min(1).max(50).required(),
});
