require('dotenv').config();
const createApp = require('./app');
const { connectDB } = require('./config/db');

let app;
let dbConnected = false;

/**
 * Serverless-compatible handler for Vercel.
 * Reuses the DB connection and app instance across warm invocations.
 */
module.exports = async (req, res) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  if (!app) {
    app = createApp();
  }
  app(req, res);
};
