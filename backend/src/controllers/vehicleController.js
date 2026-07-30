const Vehicle = require('../models/Vehicle');
const Activity = require('../models/Activity');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginationMeta } = require('../utils/pagination');
const { getVehicleImage } = require('../utils/vehicleImages');
const { completePurchase } = require('../services/purchaseService');

const generateVin = () => `AH${crypto.randomUUID().replace(/-/g, '').slice(0, 15).toUpperCase()}`;

const buildVehicleFilter = (query) => {
  const { make, model, category, fuelType, transmission, year, minPrice, maxPrice, inStockOnly } = query;
  const filter = {};

  if (make) filter.make = { $regex: make, $options: 'i' };
  if (model) filter.model = { $regex: model, $options: 'i' };
  if (category) filter.category = { $regex: `^${category}$`, $options: 'i' };
  if (fuelType) filter.fuelType = { $regex: `^${fuelType}$`, $options: 'i' };
  if (transmission) filter.transmission = { $regex: `^${transmission}$`, $options: 'i' };
  if (year !== undefined && year !== '') filter.year = Number(year);
  if (inStockOnly === 'true') filter.quantity = { $gt: 0 };

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined && minPrice !== '') filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '') filter.price.$lte = Number(maxPrice);
  }

  return filter;
};

const getSort = (sort) => {
  const options = {
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    oldest: { year: 1, createdAt: 1 },
    alphabetical: { make: 1, model: 1 },
    newest: { createdAt: -1 },
  };
  return options[sort] || options.newest;
};

const queryVehicles = async (req, res) => {
  const filter = buildVehicleFilter(req.query);
  const pagination = parsePagination(req.query);
  const [total, vehicles] = await Promise.all([
    Vehicle.countDocuments(filter),
    Vehicle.find(filter)
      .sort(getSort(req.query.sort))
      .skip(pagination.skip)
      .limit(pagination.limit),
  ]);

  res.status(200).json({
    success: true,
    count: vehicles.length,
    pagination: paginationMeta(total, pagination),
    data: vehicles,
  });
};

/**
 * @route   POST /api/vehicles
 * @access  Protected
 */
const createVehicle = async (req, res, next) => {
  try {
    const { make, model, category, price, quantity } = req.body;

    if (!make || !model || !category || price === undefined) {
      throw new ApiError(400, 'make, model, category and price are required.');
    }

    const vehicle = await Vehicle.create({
      ...req.body,
      quantity: quantity ?? 0,
      vin: req.body.vin || generateVin(),
      imageUrl: req.body.imageUrl || getVehicleImage(category),
    });

    await Activity.create({
      type: 'vehicle_added',
      vehicle: vehicle._id,
      actor: req.user._id,
      message: `${vehicle.make} ${vehicle.model} was added to inventory.`,
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/vehicles
 * @access  Protected
 * Lists vehicles with pagination and optional advanced filters.
 */
const getVehicles = async (req, res, next) => {
  try {
    await queryVehicles(req, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/vehicles/search
 * @access  Protected
 * Query params: make, model, category, fuelType, transmission, year,
 * minPrice, maxPrice, sort, page and limit. All filters use AND semantics.
 */
const searchVehicles = async (req, res, next) => {
  try {
    await queryVehicles(req, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/vehicles/:id
 * @access  Protected
 */
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found.');

    await Activity.create({
      type: 'vehicle_updated',
      vehicle: vehicle._id,
      actor: req.user._id,
      message: `${vehicle.make} ${vehicle.model} was updated.`,
    });

    res.status(200).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/vehicles/:id
 * @access  Protected
 */
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) throw new ApiError(404, 'Vehicle not found.');

    res.status(200).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/vehicles/:id
 * @access  Protected (Admin only)
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found.');

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/vehicles/:id/purchase
 * @access  Protected
 * Decreases quantity by 1 (or req.body.quantity if provided).
 * Rejects the purchase if there isn't enough stock, which prevents
 * the quantity from ever going negative.
 */
const purchaseVehicle = async (req, res, next) => {
  try {
    const amount = Number(req.body.quantity) || 1;
    if (amount <= 0) throw new ApiError(400, 'Purchase quantity must be greater than zero.');

    const { vehicle, purchase, invoice } = await completePurchase({
      vehicleId: req.params.id,
      customer: req.user,
      quantity: amount,
    });

    res.status(200).json({
      success: true,
      message: 'Purchase successful. Invoice generated.',
      data: vehicle,
      purchase,
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/vehicles/:id/restock
 * @access  Protected (Admin only)
 * Increases quantity by req.body.quantity (defaults to 1).
 */
const restockVehicle = async (req, res, next) => {
  try {
    const amount = Number(req.body.quantity) || 1;
    if (amount <= 0) throw new ApiError(400, 'Restock quantity must be greater than zero.');

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found.');

    vehicle.quantity += amount;
    await vehicle.save();

    await Activity.create({
      type: 'vehicle_restocked',
      vehicle: vehicle._id,
      actor: req.user._id,
      message: `${vehicle.make} ${vehicle.model} was restocked by ${amount} unit(s).`,
    });

    res.status(200).json({ success: true, message: 'Restock successful.', data: vehicle });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  searchVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
};
