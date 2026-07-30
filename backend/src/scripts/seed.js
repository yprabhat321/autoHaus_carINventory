require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Purchase = require('../models/Purchase');
const Activity = require('../models/Activity');

const catalog = [
  ['Toyota', 'Camry', 'Sedan'], ['Honda', 'Civic', 'Sedan'], ['Hyundai', 'Creta', 'SUV'],
  ['Mahindra', 'XUV700', 'SUV'], ['Tata', 'Nexon', 'SUV'], ['Ford', 'Mustang', 'Coupe'],
  ['BMW', 'X5', 'SUV'], ['Mercedes-Benz', 'C-Class', 'Sedan'], ['Kia', 'Seltos', 'SUV'],
  ['Volkswagen', 'Virtus', 'Sedan'], ['Maruti Suzuki', 'Swift', 'Hatchback'], ['Jeep', 'Compass', 'SUV'],
];
const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const transmissions = ['Manual', 'Automatic'];

const buildVehicles = () => Array.from({ length: 100 }, (_, index) => {
  const [make, model, category] = catalog[index % catalog.length];
  const year = 2020 + (index % 7);
  return {
    make,
    model: `${model}${index >= catalog.length ? ` ${index + 1}` : ''}`,
    category,
    year,
    fuelType: fuelTypes[index % fuelTypes.length],
    transmission: transmissions[index % transmissions.length],
    price: 12000 + ((index * 2350) % 90000),
    quantity: index % 17 === 0 ? 0 : (index % 8) + 1,
    imageUrl: '',
    description: `A carefully inspected ${year} ${make} ${model}.`,
  };
});

const seed = async () => {
  await connectDB();

  await Promise.all([Activity.deleteMany({}), Purchase.deleteMany({}), Vehicle.deleteMany({}), User.deleteMany({})]);

  const admin = await User.create({
    name: 'AutoHaus Administrator',
    email: 'admin@dealership.com',
    password: 'Admin@123',
    role: 'admin',
  });
  const customers = await User.create(
    Array.from({ length: 10 }, (_, index) => ({
      name: `Customer ${index + 1}`,
      email: `customer${index + 1}@dealership.com`,
      password: 'Customer@123',
      role: 'customer',
    }))
  );
  const vehicles = await Vehicle.insertMany(buildVehicles());

  await Activity.create({
    type: 'vehicle_added',
    actor: admin._id,
    vehicle: vehicles[0]._id,
    message: 'Initial inventory seeded.',
  });

  console.log(`Seeded 1 admin, ${customers.length} customers and ${vehicles.length} vehicles.`);
  console.log('Admin login: admin@dealership.com / Admin@123');
};

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
