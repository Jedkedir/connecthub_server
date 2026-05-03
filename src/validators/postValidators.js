import Joi from 'joi';

export const createPostSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  mediaUrls: Joi.array().items(Joi.string().uri()).max(10).default([])
});

export const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required()
});
