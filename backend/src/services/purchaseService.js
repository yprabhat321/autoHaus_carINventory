const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Purchase = require('../models/Purchase');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const { createInvoice } = require('./invoiceService');

// Mongoose treats a second `undefined` argument to Model.create as another
// document in some runtime paths. Only supply options when a real session is
// present, and use the array form required by Mongoose for session-aware create.
const createDocument = async (Model, payload, session) => {
  if (!session) return Model.create(payload);
  const [document] = await Model.create([payload], { session });
  return document;
};

const transactionUnavailable = (error) => {
  const message = error?.message || '';
  return error?.code === 20
    || message.includes('Transaction numbers are only allowed')
    || message.includes('does not support transactions');
};

const buildPurchase = async ({ vehicleId, customer, quantity, session, progress }) => {
  const options = { new: true, ...(session ? { session } : {}) };
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: vehicleId, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    options
  );

  if (!vehicle) {
    const exists = await Vehicle.exists({ _id: vehicleId }, session ? { session } : undefined);
    if (!exists) throw new ApiError(404, 'Vehicle not found.');
    throw new ApiError(409, 'Insufficient stock for this purchase.');
  }
  if (progress) progress.vehicle = vehicle;

  const purchase = await createDocument(Purchase, {
    vehicle: vehicle._id,
    customer: customer._id,
    quantity,
    price: vehicle.price,
    vehicleSnapshot: { make: vehicle.make, model: vehicle.model, imageUrl: vehicle.imageUrl },
  }, session);
  if (progress) progress.purchase = purchase;

  const invoice = await createInvoice({ customer, vehicle, purchase, quantity, session });
  if (progress) progress.invoice = invoice;
  await createDocument(Activity, {
    type: 'vehicle_purchased',
    vehicle: vehicle._id,
    actor: customer._id,
    message: `${quantity} × ${vehicle.make} ${vehicle.model} purchased.`,
  }, session);
  await createDocument(Activity, {
    type: 'invoice_created',
    vehicle: vehicle._id,
    actor: customer._id,
    message: `Invoice ${invoice.invoiceNumber} was created.`,
  }, session);

  return { vehicle, purchase, invoice };
};

const fallbackPurchase = async (payload) => {
  const progress = {};
  try {
    return await buildPurchase({ ...payload, progress });
  } catch (error) {
    // A standalone MongoDB deployment cannot use transactions. Compensate for
    // partial writes so a failed invoice can never silently reduce stock.
    if (progress.invoice) await Invoice.deleteOne({ _id: progress.invoice._id });
    if (progress.purchase) await Purchase.deleteOne({ _id: progress.purchase._id });
    if (progress.vehicle) await Vehicle.updateOne({ _id: progress.vehicle._id }, { $inc: { quantity: payload.quantity } });
    throw error;
  }
};

const completePurchase = async ({ vehicleId, customer, quantity }) => {
  let session;
  try {
    session = await mongoose.startSession();
    let completed;
    await session.withTransaction(async () => {
      completed = await buildPurchase({ vehicleId, customer, quantity, session });
    });
    return completed;
  } catch (error) {
    if (!transactionUnavailable(error)) throw error;
    return fallbackPurchase({ vehicleId, customer, quantity });
  } finally {
    if (session) await session.endSession();
  }
};

module.exports = { completePurchase, transactionUnavailable };
