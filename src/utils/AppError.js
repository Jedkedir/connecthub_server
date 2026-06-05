/**
 * Application-specific error with an HTTP status and stable API error code.
 */
export class AppError extends Error {
  /**
   * Builds an operational error that the error middleware can serialize.
   * @param {string} code - Stable machine-readable error code.
   * @param {string} message - Human-readable error message.
   * @param {number} [statusCode=400] - HTTP status code for the response.
   */
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
