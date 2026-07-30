const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

/**
 * Spins up an ephemeral, real MongoDB instance in memory so integration
 * tests exercise the actual Mongoose models/queries instead of mocks.
 *
 * NOTE: the very first run needs an internet connection so
 * mongodb-memory-server can download a local `mongod` binary (it is then
 * cached under ~/.cache for subsequent runs). This is purely a *test*
 * convenience — the deployed application always talks to a real,
 * persistent MongoDB instance via MONGO_URI, exactly as the assignment
 * requires.
 */
const connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};

const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

module.exports = { connect, closeDatabase, clearDatabase };
