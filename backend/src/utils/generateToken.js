const jwt = require('jsonwebtoken');

/**
 * Signs a JWT embedding the user's id and role.
 * The role is included so downstream middleware can authorize
 * admin-only routes without an extra database lookup on every request.
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined. Please set it in your .env file.');
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
