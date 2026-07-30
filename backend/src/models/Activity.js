const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['vehicle_added', 'vehicle_updated', 'vehicle_purchased', 'vehicle_restocked', 'invoice_created', 'invoice_downloaded'],
      required: true,
    },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
