const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginationMeta } = require('../utils/pagination');
const { createInvoicePdfBuffer } = require('../utils/createInvoicePdf');

const allowedPaymentStatuses = new Set(['paid', 'pending']);
const allowedInvoiceStatuses = new Set(['issued', 'cancelled']);

const dateRange = (period, dateFrom, dateTo) => {
  const range = {};
  const now = new Date();
  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    range.$gte = start;
  }
  if (period === 'last7') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    range.$gte = start;
  }
  if (period === 'last30') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    range.$gte = start;
  }
  if (dateFrom) {
    const start = new Date(dateFrom);
    if (Number.isNaN(start.getTime())) throw new ApiError(400, 'dateFrom must be a valid date.');
    range.$gte = start;
  }
  if (dateTo) {
    const end = new Date(dateTo);
    if (Number.isNaN(end.getTime())) throw new ApiError(400, 'dateTo must be a valid date.');
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

const buildFilter = async (query, customerId) => {
  // Customers cannot see archived invoices. Administrators keep access to
  // every invoice, including soft-deleted/cancelled records for auditability.
  const filter = customerId ? { customer: customerId, isDeleted: { $ne: true } } : {};
  if (query.paymentStatus) {
    if (!allowedPaymentStatuses.has(query.paymentStatus)) throw new ApiError(400, 'Invalid payment status.');
    filter.paymentStatus = query.paymentStatus;
  }
  if (query.invoiceStatus) {
    if (!allowedInvoiceStatuses.has(query.invoiceStatus)) throw new ApiError(400, 'Invalid invoice status.');
    filter.invoiceStatus = query.invoiceStatus;
  }
  const purchaseDate = dateRange(query.period, query.dateFrom, query.dateTo);
  if (purchaseDate) filter.purchaseDate = purchaseDate;

  const term = query.search?.trim();
  if (!term) return filter;
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [customers, vehicles] = await Promise.all([
    User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id'),
    Vehicle.find({ $or: [{ make: regex }, { model: regex }] }).select('_id'),
  ]);
  const matches = [{ invoiceNumber: regex }];
  if (customers.length) matches.push({ customer: { $in: customers.map((customer) => customer._id) } });
  if (vehicles.length) matches.push({ vehicle: { $in: vehicles.map((vehicle) => vehicle._id) } });
  filter.$or = matches;
  return filter;
};

const sortFor = (sort) => ({
  oldest: { purchaseDate: 1 },
  totalHigh: { totalAmount: -1, purchaseDate: -1 },
  totalLow: { totalAmount: 1, purchaseDate: -1 },
}[sort] || { purchaseDate: -1 });

const populateInvoice = (query) => query
  .populate('customer', 'name email')
  .populate('vehicle', 'make model category price imageUrl');

const listInvoices = (customerOnly = false) => async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const filter = await buildFilter(req.query, customerOnly ? req.user._id : null);
    const [total, invoices] = await Promise.all([
      Invoice.countDocuments(filter),
      populateInvoice(Invoice.find(filter)
        .sort(sortFor(req.query.sort))
        .skip(pagination.skip)
        .limit(pagination.limit)),
    ]);
    res.status(200).json({
      success: true,
      count: invoices.length,
      pagination: paginationMeta(total, pagination),
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
};

const findAccessibleInvoice = async (id, user) => {
  const filter = user.role === 'admin' ? { _id: id } : { _id: id, isDeleted: { $ne: true } };
  const invoice = await populateInvoice(Invoice.findOne(filter));
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (user.role !== 'admin' && String(invoice.customer?._id || invoice.customer) !== String(user._id)) {
    throw new ApiError(403, 'You do not have access to this invoice.');
  }
  return invoice;
};

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await findAccessibleInvoice(req.params.id, req.user);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const invoice = await findAccessibleInvoice(req.params.id, req.user);
    const pdf = await createInvoicePdfBuffer(invoice);
    await Activity.create({
      type: 'invoice_downloaded',
      vehicle: invoice.vehicle?._id || invoice.vehicle,
      actor: req.user._id,
      message: `Invoice ${invoice.invoiceNumber} was downloaded.`,
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.status(200).send(pdf);
  } catch (err) {
    next(err);
  }
};

const softDeleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id, invoiceStatus: 'cancelled' },
      { new: true }
    );
    if (!invoice) throw new ApiError(404, 'Invoice not found.');
    res.status(200).json({ success: true, message: 'Invoice archived.', data: invoice });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInvoices: listInvoices(true),
  getAllInvoices: listInvoices(false),
  getInvoice,
  downloadInvoice,
  softDeleteInvoice,
};
