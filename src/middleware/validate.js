import { AppError } from '../utils/AppError.js';

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
