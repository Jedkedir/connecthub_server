import Joi from 'joi';

export const objectId = Joi.string().hex().length(24);

export const paginationQuery = Joi.object({
  cursor: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});
