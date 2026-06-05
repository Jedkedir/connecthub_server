import { AppError } from '../utils/AppError.js';

/**
 * Validates a request property with Joi and replaces it with stripped output.
 * @param {import('joi').Schema} schema - Joi schema to apply.
 * @param {string} [property='body'] - Request property to validate.
 * @returns {Function} Express middleware.
 */
export const validate = (schema, property = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    next(new AppError('VALIDATION_ERROR', message, 400));
    return;
  }

  req[property] = value;
  next();
};
