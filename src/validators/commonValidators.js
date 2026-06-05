import Joi from 'joi';

/**
 * Joi rule for MongoDB ObjectId strings.
 */
export const objectId = Joi.string().hex().length(24);

/**
 * Common cursor and limit query schema.
 */
export const paginationQuery = Joi.object({
  cursor: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});
