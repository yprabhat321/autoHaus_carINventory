const mongoose = require('mongoose');

// A small daily counter avoids race conditions when two purchases are
// completed at the same time while preserving the requested invoice format.
const invoiceSequenceSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InvoiceSequence', invoiceSequenceSchema);
