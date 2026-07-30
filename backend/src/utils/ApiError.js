/**
 * A small typed error so controllers can throw with an explicit
 * HTTP status code, and a single error-handling middleware can
 * translate it into a consistent JSON response.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

module.exports = ApiError;
