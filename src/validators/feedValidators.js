import Joi from 'joi';

export const feedQuerySchema = Joi.object({
  cursor: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  q: Joi.string().trim().max(100).optional()
});
