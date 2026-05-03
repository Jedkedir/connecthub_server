import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  bio: Joi.string().max(280).allow('').optional(),
  profilePic: Joi.string().uri().allow('').optional()
}).min(1);
