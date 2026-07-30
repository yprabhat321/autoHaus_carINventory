const ApiError = require('../utils/ApiError');

/**
 * Must run after `protect`. Restricts a route to users whose role is 'admin'.
 * Kept separate from `protect` (single responsibility) so routes can mix
 * "authenticated" and "authenticated + admin" requirements independently.
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authorized.'));
  }

  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Access denied. Admin privileges required.'));
  }

  next();
};

module.exports = adminOnly;
