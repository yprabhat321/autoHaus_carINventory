const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB using the URI supplied via
 * environment variables. Throws (rather than calling process.exit)
 * so that the caller decides how to react — this keeps the module
 * easy to unit test and reusable in different runtime contexts
 * (server boot, seed scripts, test setup, etc.).
 *
 * @param {string} [uri] - Optional override, defaults to process.env.MONGO_URI
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async (uri = process.env.MONGO_URI) => {
  if (!uri) {
    throw new Error('MONGO_URI is not defined. Please set it in your .env file.');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri);
  return conn;
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
