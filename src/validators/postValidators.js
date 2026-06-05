import Joi from 'joi';
import { objectId } from './commonValidators.js';

/**
 * Validates post creation payloads.
 */
export const createPostSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  mediaUrls: Joi.array().items(Joi.string().uri()).max(10).default([]),
  topic: Joi.string().trim().max(100).optional(),
  topics: Joi.array().items(Joi.string().trim().max(100)).max(10).optional(),
  mentions: Joi.array().items(Joi.string().trim().max(100)).max(10).optional()
});

/**
 * Validates comment and reply payloads.
 */
export const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
  parentCommentId: objectId.allow(null).optional(),
  mentions:Joi.array().items(Joi.string().trim().max(100)).max(10).optional()
});
