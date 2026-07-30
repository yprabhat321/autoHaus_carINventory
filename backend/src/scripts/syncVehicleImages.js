require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const Vehicle = require('../models/Vehicle');
const { imageByCategory } = require('../utils/vehicleImages');

const run = async () => {
  await connectDB();
  const updates = await Promise.all(
    Object.entries(imageByCategory).map(async ([category, imageUrl]) => {
      const result = await Vehicle.updateMany({ category }, { $set: { imageUrl } });
      return result.modifiedCount;
    })
  );
  console.log(`Vehicle image sync complete: ${updates.reduce((total, count) => total + count, 0)} records updated.`);
};

run()
  .catch((err) => {
    console.error('Vehicle image sync failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
