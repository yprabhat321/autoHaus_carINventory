require('dotenv').config();

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { connectDB, disconnectDB } = require('../config/db');
const Vehicle = require('../models/Vehicle');

const projectRoot = path.resolve(__dirname, '../../..');
const outputDirectory = path.join(projectRoot, 'frontend', 'public', 'images', 'vehicle-catalog');
const rendererPath = path.join(__dirname, 'renderVehicleImages.ps1');
const attributionPath = path.join(projectRoot, 'docs', 'vehicle-image-attribution.json');

const baseImageByCategory = {
  Hatchback: '/images/vehicles/hatchback.jpg',
  Sedan: '/images/vehicles/sedan.jpg',
  SUV: '/images/vehicles/suv.jpg',
  MUV: '/images/vehicles/muv.jpg',
  EV: '/images/vehicles/ev.jpg',
  Luxury: '/images/vehicles/luxury.jpg',
  Coupe: '/images/vehicles/luxury.jpg',
  Truck: '/images/vehicles/suv.jpg',
  Convertible: '/images/vehicles/luxury.jpg',
  Van: '/images/vehicles/muv.jpg',
};

const run = async () => {
  await connectDB();
  const vehicles = await Vehicle.find().sort({ createdAt: 1 });
  if (vehicles.length !== 101) {
    throw new Error(`Expected 101 vehicles before image assignment; found ${vehicles.length}.`);
  }

  await fs.mkdir(outputDirectory, { recursive: true });
  const manifestPath = path.join(os.tmpdir(), `autohause-vehicle-images-${Date.now()}.json`);
  const manifest = vehicles.map((vehicle, index) => ({
    id: vehicle._id.toString(),
    index,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    category: vehicle.category,
    fuelType: vehicle.fuelType,
    baseImage: baseImageByCategory[vehicle.category] || baseImageByCategory.SUV,
  }));

  try {
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
    const rendered = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', rendererPath, '-ManifestPath', manifestPath, '-ProjectRoot', projectRoot],
      { encoding: 'utf8', timeout: 180000, maxBuffer: 1024 * 1024 }
    );
    if (rendered.status !== 0) {
      throw new Error(rendered.stderr || rendered.stdout || 'Vehicle image renderer failed.');
    }

    await Vehicle.bulkWrite(
      manifest.map((vehicle) => ({
        updateOne: {
          filter: { _id: vehicle.id },
          update: { $set: { imageUrl: `/images/vehicle-catalog/${vehicle.id}.jpg` } },
        },
      }))
    );
    await fs.writeFile(
      attributionPath,
      `${JSON.stringify(manifest.map((vehicle) => ({
        vehicleId: vehicle.id,
        vehicle: `${vehicle.make} ${vehicle.model}`,
        localPath: `/images/vehicle-catalog/${vehicle.id}.jpg`,
        basePhoto: vehicle.baseImage,
      })), null, 2)}\n`
    );
    console.log(`Assigned ${manifest.length} unique local vehicle image assets.`);
  } finally {
    await fs.rm(manifestPath, { force: true });
  }
};

run()
  .catch((err) => {
    console.error('Unique vehicle image assignment failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
