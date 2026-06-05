/**
 * Wraps an Express handler and forwards rejected promises to the error stack.
 * @param {Function} fn - Express route or middleware handler.
 * @returns {Function} Middleware that catches asynchronous failures.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
