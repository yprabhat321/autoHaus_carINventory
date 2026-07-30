const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Invoice quantity must be at least one'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'paid',
    },
    invoiceStatus: {
      type: String,
      enum: ['issued', 'cancelled'],
      default: 'issued',
    },
    // Snapshots keep historical invoices intelligible even if a vehicle or
    // customer is later updated. The references above remain the source of truth.
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    vehicleSnapshot: {
      make: { type: String, required: true },
      model: { type: String, required: true },
      category: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

invoiceSchema.index({ customer: 1, purchaseDate: -1 });
invoiceSchema.index({ vehicle: 1, purchaseDate: -1 });
invoiceSchema.index({ invoiceStatus: 1, paymentStatus: 1, purchaseDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
