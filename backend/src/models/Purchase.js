const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Purchase quantity must be at least one'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['completed'],
      default: 'completed',
    },
    vehicleSnapshot: {
      make: String,
      model: String,
      imageUrl: String,
    },
  },
  { timestamps: true }
);

purchaseSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
