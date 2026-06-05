import Joi from 'joi';
import { objectId } from './commonValidators.js';

/**
 * Validates follow targets supplied by the acting user.
 */
export const followTargetSchema = Joi.object({
  targetUserId: objectId.required()
});

/**
 * Validates requester IDs when accepting or rejecting requests.
 */
export const followRequesterSchema = Joi.object({
  requesterId: objectId.required()
});
