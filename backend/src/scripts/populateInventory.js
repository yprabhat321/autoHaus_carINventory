require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const Vehicle = require('../models/Vehicle');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { getVehicleImage } = require('../utils/vehicleImages');

// Curated Indian-market catalogue. Prices are indicative INR ex-showroom prices.
// imageUrl deliberately follows the project’s existing image field rather than adding a second image schema property.
const catalog = [
  { make: 'Tata', model: 'Tiago', year: 2024, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', price: 535000, quantity: 12 },
  { make: 'Tata', model: 'Tigor', year: 2024, category: 'Sedan', fuelType: 'CNG', transmission: 'Manual', price: 630000, quantity: 8 },
  { make: 'Tata', model: 'Altroz', year: 2025, category: 'Hatchback', fuelType: 'Diesel', transmission: 'Manual', price: 689000, quantity: 7 },
  { make: 'Tata', model: 'Punch', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 620000, quantity: 15 },
  { make: 'Tata', model: 'Nexon', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 800000, quantity: 11 },
  { make: 'Tata', model: 'Harrier', year: 2024, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 1549000, quantity: 6 },
  { make: 'Tata', model: 'Safari', year: 2025, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 1599000, quantity: 5 },
  { make: 'Tata', model: 'Curvv', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 999000, quantity: 9 },
  { make: 'Tata', model: 'Tiago EV', year: 2024, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 799000, quantity: 10 },
  { make: 'Tata', model: 'Tigor EV', year: 2024, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 1249000, quantity: 4 },
  { make: 'Tata', model: 'Punch EV', year: 2025, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 1099000, quantity: 8 },
  { make: 'Tata', model: 'Nexon EV', year: 2025, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 1249000, quantity: 7 },

  { make: 'Mahindra', model: 'XUV 3XO', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 799000, quantity: 14 },
  { make: 'Mahindra', model: 'XUV700', year: 2024, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 1399000, quantity: 9 },
  { make: 'Mahindra', model: 'Scorpio N', year: 2025, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 1360000, quantity: 6 },
  { make: 'Mahindra', model: 'Bolero', year: 2024, category: 'SUV', fuelType: 'Diesel', transmission: 'Manual', price: 979000, quantity: 11 },
  { make: 'Mahindra', model: 'Bolero Neo', year: 2024, category: 'SUV', fuelType: 'Diesel', transmission: 'Manual', price: 949000, quantity: 8 },
  { make: 'Mahindra', model: 'Thar', year: 2025, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 1149000, quantity: 12 },
  { make: 'Mahindra', model: 'Thar Roxx', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1299000, quantity: 5 },
  { make: 'Mahindra', model: 'XUV400', year: 2024, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 1550000, quantity: 7 },
  { make: 'Mahindra', model: 'Marazzo', year: 2023, category: 'MUV', fuelType: 'Diesel', transmission: 'Manual', price: 1460000, quantity: 3 },
  { make: 'Mahindra', model: 'KUV100 NXT', year: 2021, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', price: 615000, quantity: 2 },

  { make: 'Hyundai', model: 'Grand i10 Nios', year: 2024, category: 'Hatchback', fuelType: 'CNG', transmission: 'Manual', price: 598000, quantity: 12 },
  { make: 'Hyundai', model: 'i20', year: 2025, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Automatic', price: 735000, quantity: 10 },
  { make: 'Hyundai', model: 'i20 N Line', year: 2024, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', price: 999000, quantity: 4 },
  { make: 'Hyundai', model: 'Aura', year: 2024, category: 'Sedan', fuelType: 'CNG', transmission: 'Manual', price: 649000, quantity: 9 },
  { make: 'Hyundai', model: 'Verna', year: 2025, category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', price: 1107000, quantity: 6 },
  { make: 'Hyundai', model: 'Exter', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 612000, quantity: 13 },
  { make: 'Hyundai', model: 'Venue', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 794000, quantity: 10 },
  { make: 'Hyundai', model: 'Creta', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1100000, quantity: 15 },
  { make: 'Hyundai', model: 'Alcazar', year: 2024, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 1690000, quantity: 5 },
  { make: 'Hyundai', model: 'Tucson', year: 2024, category: 'Luxury', fuelType: 'Petrol', transmission: 'Automatic', price: 2900000, quantity: 2 },
  { make: 'Hyundai', model: 'Ioniq 5', year: 2025, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 4605000, quantity: 3 },
  { make: 'Hyundai', model: 'Kona Electric', year: 2023, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 2395000, quantity: 1 },

  { make: 'Kia', model: 'Sonet', year: 2025, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 799000, quantity: 12 },
  { make: 'Kia', model: 'Seltos', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1099000, quantity: 10 },
  { make: 'Kia', model: 'Carens', year: 2025, category: 'MUV', fuelType: 'Diesel', transmission: 'Automatic', price: 1052000, quantity: 8 },
  { make: 'Kia', model: 'Carnival', year: 2025, category: 'Luxury', fuelType: 'Diesel', transmission: 'Automatic', price: 6300000, quantity: 2 },
  { make: 'Kia', model: 'EV6', year: 2024, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 6595000, quantity: 3 },
  { make: 'Kia', model: 'EV9', year: 2025, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 12990000, quantity: 1 },
  { make: 'Kia', model: 'Syros', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 900000, quantity: 6 },
  { make: 'Kia', model: 'Seltos X-Line', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 2000000, quantity: 4 },

  { make: 'Maruti Suzuki', model: 'Alto K10', year: 2024, category: 'Hatchback', fuelType: 'CNG', transmission: 'Manual', price: 399000, quantity: 15 },
  { make: 'Maruti Suzuki', model: 'S-Presso', year: 2024, category: 'Hatchback', fuelType: 'CNG', transmission: 'Manual', price: 426000, quantity: 10 },
  { make: 'Maruti Suzuki', model: 'Celerio', year: 2025, category: 'Hatchback', fuelType: 'CNG', transmission: 'Automatic', price: 541000, quantity: 9 },
  { make: 'Maruti Suzuki', model: 'WagonR', year: 2024, category: 'Hatchback', fuelType: 'CNG', transmission: 'Manual', price: 555000, quantity: 13 },
  { make: 'Maruti Suzuki', model: 'Swift', year: 2025, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Automatic', price: 649000, quantity: 15 },
  { make: 'Maruti Suzuki', model: 'Dzire', year: 2025, category: 'Sedan', fuelType: 'CNG', transmission: 'Automatic', price: 679000, quantity: 11 },
  { make: 'Maruti Suzuki', model: 'Baleno', year: 2024, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Automatic', price: 666000, quantity: 12 },
  { make: 'Maruti Suzuki', model: 'Fronx', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 752000, quantity: 10 },
  { make: 'Maruti Suzuki', model: 'Ignis', year: 2023, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', price: 584000, quantity: 5 },
  { make: 'Maruti Suzuki', model: 'Brezza', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 835000, quantity: 13 },
  { make: 'Maruti Suzuki', model: 'Ertiga', year: 2024, category: 'MUV', fuelType: 'CNG', transmission: 'Manual', price: 869000, quantity: 10 },
  { make: 'Maruti Suzuki', model: 'XL6', year: 2025, category: 'MUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1161000, quantity: 6 },
  { make: 'Maruti Suzuki', model: 'Jimny', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1274000, quantity: 4 },
  { make: 'Maruti Suzuki', model: 'Ciaz', year: 2023, category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', price: 935000, quantity: 3 },
  { make: 'Maruti Suzuki', model: 'Invicto', year: 2025, category: 'MUV', fuelType: 'Petrol', transmission: 'Automatic', price: 2505000, quantity: 2 },

  { make: 'Toyota', model: 'Glanza', year: 2025, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Automatic', price: 670000, quantity: 11 },
  { make: 'Toyota', model: 'Taisor', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 774000, quantity: 8 },
  { make: 'Toyota', model: 'Urban Cruiser Hyryder', year: 2024, category: 'SUV', fuelType: 'Hybrid', transmission: 'Automatic', price: 1150000, quantity: 7 },
  { make: 'Toyota', model: 'Rumion', year: 2024, category: 'MUV', fuelType: 'CNG', transmission: 'Manual', price: 1054000, quantity: 5 },
  { make: 'Toyota', model: 'Innova Crysta', year: 2025, category: 'MUV', fuelType: 'Diesel', transmission: 'Manual', price: 1999000, quantity: 6 },
  { make: 'Toyota', model: 'Innova Hycross', year: 2025, category: 'MUV', fuelType: 'Hybrid', transmission: 'Automatic', price: 1960000, quantity: 5 },
  { make: 'Toyota', model: 'Fortuner', year: 2024, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 3365000, quantity: 4 },
  { make: 'Toyota', model: 'Hilux', year: 2024, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 3050000, quantity: 2 },
  { make: 'Toyota', model: 'Camry', year: 2025, category: 'Luxury', fuelType: 'Hybrid', transmission: 'Automatic', price: 4837000, quantity: 2 },
  { make: 'Toyota', model: 'Vellfire', year: 2025, category: 'Luxury', fuelType: 'Hybrid', transmission: 'Automatic', price: 12200000, quantity: 1 },

  { make: 'Honda', model: 'Amaze', year: 2025, category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', price: 799000, quantity: 10 },
  { make: 'Honda', model: 'City', year: 2024, category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', price: 1182000, quantity: 7 },
  { make: 'Honda', model: 'Elevate', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1208000, quantity: 8 },
  { make: 'Honda', model: 'City e:HEV', year: 2024, category: 'Sedan', fuelType: 'Hybrid', transmission: 'Automatic', price: 1989000, quantity: 2 },

  { make: 'MG', model: 'Comet EV', year: 2025, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 699000, quantity: 8 },
  { make: 'MG', model: 'Astor', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 999000, quantity: 7 },
  { make: 'MG', model: 'Hector', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1399000, quantity: 5 },
  { make: 'MG', model: 'Hector Plus', year: 2024, category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', price: 1729000, quantity: 4 },
  { make: 'MG', model: 'ZS EV', year: 2024, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 1898000, quantity: 5 },
  { make: 'MG', model: 'Gloster', year: 2025, category: 'Luxury', fuelType: 'Diesel', transmission: 'Automatic', price: 3800000, quantity: 2 },
  { make: 'MG', model: 'Windsor EV', year: 2025, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 1400000, quantity: 7 },
  { make: 'MG', model: 'M9', year: 2025, category: 'Luxury', fuelType: 'Electric', transmission: 'Automatic', price: 6990000, quantity: 1 },
  { make: 'MG', model: 'Cyberster', year: 2025, category: 'Luxury', fuelType: 'Electric', transmission: 'Automatic', price: 7500000, quantity: 1 },

  { make: 'Skoda', model: 'Slavia', year: 2025, category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', price: 1069000, quantity: 6 },
  { make: 'Skoda', model: 'Kushaq', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1089000, quantity: 7 },
  { make: 'Skoda', model: 'Kodiaq', year: 2025, category: 'Luxury', fuelType: 'Petrol', transmission: 'Automatic', price: 4646000, quantity: 2 },
  { make: 'Skoda', model: 'Superb', year: 2023, category: 'Luxury', fuelType: 'Petrol', transmission: 'Automatic', price: 5450000, quantity: 1 },
  { make: 'Skoda', model: 'Octavia', year: 2021, category: 'Luxury', fuelType: 'Petrol', transmission: 'Automatic', price: 2695000, quantity: 1 },
  { make: 'Skoda', model: 'Kylaq', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 789000, quantity: 8 },
  { make: 'Skoda', model: 'Enyaq', year: 2025, category: 'EV', fuelType: 'Electric', transmission: 'Automatic', price: 5000000, quantity: 1 },

  { make: 'Volkswagen', model: 'Virtus', year: 2025, category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', price: 1156000, quantity: 7 },
  { make: 'Volkswagen', model: 'Taigun', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1170000, quantity: 6 },
  { make: 'Volkswagen', model: 'Tiguan', year: 2024, category: 'Luxury', fuelType: 'Petrol', transmission: 'Automatic', price: 3507000, quantity: 2 },
  { make: 'Volkswagen', model: 'Tiguan R-Line', year: 2025, category: 'Luxury', fuelType: 'Petrol', transmission: 'Automatic', price: 4900000, quantity: 1 },
  { make: 'Volkswagen', model: 'Vento', year: 2021, category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', price: 1099000, quantity: 2 },

  { make: 'Nissan', model: 'Magnite', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 614000, quantity: 9 },
  { make: 'Nissan', model: 'Kicks', year: 2021, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1050000, quantity: 2 },
  { make: 'Nissan', model: 'X-Trail', year: 2025, category: 'Luxury', fuelType: 'Petrol', transmission: 'Automatic', price: 4992000, quantity: 1 },

  { make: 'Renault', model: 'Kwid', year: 2024, category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', price: 469000, quantity: 12 },
  { make: 'Renault', model: 'Triber', year: 2025, category: 'MUV', fuelType: 'Petrol', transmission: 'Manual', price: 615000, quantity: 8 },
  { make: 'Renault', model: 'Kiger', year: 2024, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 610000, quantity: 10 },
  { make: 'Renault', model: 'Duster', year: 2025, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1200000, quantity: 4 },
  { make: 'Renault', model: 'Captur', year: 2021, category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', price: 1250000, quantity: 1 },
];

const inventoryVin = (index, vehicle) => {
  const makeCode = vehicle.make.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 7).padEnd(7, 'X');
  return `IND${String(index + 1).padStart(3, '0')}${vehicle.year}${makeCode}`;
};

const run = async () => {
  if (catalog.length !== 100) {
    throw new Error(`Catalogue must contain exactly 100 vehicles; found ${catalog.length}.`);
  }

  const keys = new Set(catalog.map((vehicle) => `${vehicle.make}|${vehicle.model}|${vehicle.year}`));
  if (keys.size !== catalog.length) {
    throw new Error('Catalogue contains a duplicate make/model/year combination.');
  }

  await connectDB();
  const importableCatalogue = catalog.map((vehicle, index) => ({ ...vehicle, vin: inventoryVin(index, vehicle) }));
  const existing = await Vehicle.find({
    $or: catalog.map(({ make, model, year }) => ({ make, model, year })),
  }).select('make model year');
  const existingKeys = new Set(existing.map((vehicle) => `${vehicle.make}|${vehicle.model}|${vehicle.year}`));
  const newVehicles = importableCatalogue
    .filter((vehicle) => !existingKeys.has(`${vehicle.make}|${vehicle.model}|${vehicle.year}`))
    .map((vehicle) => ({
      ...vehicle,
      imageUrl: getVehicleImage(vehicle.category),
      description: `Showroom-ready ${vehicle.year} ${vehicle.make} ${vehicle.model} with ${vehicle.fuelType.toLowerCase()} power and ${vehicle.transmission.toLowerCase()} transmission.`,
    }));

  const inserted = newVehicles.length ? await Vehicle.insertMany(newVehicles) : [];
  const admin = await User.findOne({ email: 'admin@dealership.com' });
  if (inserted.length && admin) {
    await Activity.create({
      type: 'vehicle_added',
      actor: admin._id,
      vehicle: inserted[0]._id,
      message: `${inserted.length} Indian-market vehicles were added to inventory.`,
    });
  }

  console.log(`Inventory import complete: ${inserted.length} added, ${existing.length} already present, ${catalog.length} catalogue entries processed.`);
};

run()
  .catch((err) => {
    console.error('Inventory import failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
