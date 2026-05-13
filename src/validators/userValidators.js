import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  username: Joi.string().regex(/^[a-zA-Z ]+$/).min(3).max(30).optional(),
  bio: Joi.string().max(280).allow('').optional(),
  profilePic: Joi.string().uri().allow('').optional()
}).min(1);
