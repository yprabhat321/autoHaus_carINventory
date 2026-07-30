const mongoose = require('mongoose');

const VEHICLE_CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Convertible', 'Van', 'MUV', 'EV', 'Luxury'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const TRANSMISSIONS = ['Manual', 'Automatic'];

const vehicleSchema = new mongoose.Schema(
  {
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    // Optional for legacy records, but populated for every imported vehicle.
    // It also satisfies an existing unique `vin` index in the connected database.
    vin: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: VEHICLE_CATEGORIES,
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    fuelType: {
      type: String,
      enum: FUEL_TYPES,
    },
    transmission: {
      type: String,
      enum: TRANSMISSIONS,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Text index so /api/vehicles/search can perform a case-insensitive
// search across make and model in addition to exact category/price filters.
vehicleSchema.index({ make: 'text', model: 'text' });

vehicleSchema.virtual('inStock').get(function inStock() {
  return this.quantity > 0;
});

vehicleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
module.exports.VEHICLE_CATEGORIES = VEHICLE_CATEGORIES;
module.exports.FUEL_TYPES = FUEL_TYPES;
module.exports.TRANSMISSIONS = TRANSMISSIONS;
