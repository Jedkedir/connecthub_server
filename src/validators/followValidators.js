import Joi from 'joi';
import { objectId } from './commonValidators.js';

export const followTargetSchema = Joi.object({
  targetUserId: objectId.required()
});

export const followRequesterSchema = Joi.object({
  requesterId: objectId.required()
});
