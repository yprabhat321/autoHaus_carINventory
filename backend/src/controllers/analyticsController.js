const Vehicle = require('../models/Vehicle');
const Purchase = require('../models/Purchase');
const Activity = require('../models/Activity');
const Invoice = require('../models/Invoice');

const inventoryAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const invoiceMatch = { isDeleted: { $ne: true }, invoiceStatus: 'issued' };
    const [overviewRows, mostExpensive, cheapest, highestStock, lowestStock, byCategory, byBrand, latestVehicles, recentPurchases, activities, monthlyPurchases, invoiceSummaryRows, todaySalesRows, monthlySalesRows, highestInvoice, recentInvoices, topSellingVehicles, topCustomers] = await Promise.all([
      Vehicle.aggregate([
        {
          $group: {
            _id: null,
            totalVehicles: { $sum: 1 },
            totalStock: { $sum: '$quantity' },
            inventoryValue: { $sum: { $multiply: ['$price', '$quantity'] } },
            averageVehiclePrice: { $avg: '$price' },
            outOfStockVehicles: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } },
            lowStockVehicles: { $sum: { $cond: [{ $and: [{ $gt: ['$quantity', 0] }, { $lt: ['$quantity', 5] }] }, 1, 0] } },
          },
        },
      ]),
      Vehicle.findOne().sort({ price: -1 }),
      Vehicle.findOne().sort({ price: 1 }),
      Vehicle.findOne().sort({ quantity: -1 }),
      Vehicle.findOne().sort({ quantity: 1 }),
      Vehicle.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, stock: { $sum: '$quantity' }, value: { $sum: { $multiply: ['$price', '$quantity'] } } } }, { $sort: { _id: 1 } }]),
      Vehicle.aggregate([{ $group: { _id: '$make', count: { $sum: 1 }, stock: { $sum: '$quantity' }, value: { $sum: { $multiply: ['$price', '$quantity'] } } } }, { $sort: { stock: -1, _id: 1 } }]),
      Vehicle.find().sort({ createdAt: -1 }).limit(5),
      Purchase.find().populate('customer', 'name').populate('vehicle', 'make model').sort({ createdAt: -1 }).limit(5),
      Activity.find().populate('actor', 'name').sort({ createdAt: -1 }).limit(8),
      Purchase.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, purchases: { $sum: '$quantity' }, revenue: { $sum: { $multiply: ['$quantity', '$price'] } } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
      Invoice.aggregate([
        { $match: invoiceMatch },
        { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, averageInvoiceValue: { $avg: '$totalAmount' }, invoiceCount: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { ...invoiceMatch, purchaseDate: { $gte: todayStart } } },
        { $group: { _id: null, value: { $sum: '$totalAmount' } } },
      ]),
      Invoice.aggregate([
        { $match: { ...invoiceMatch, purchaseDate: { $gte: monthStart } } },
        { $group: { _id: null, value: { $sum: '$totalAmount' } } },
      ]),
      populateInvoice(Invoice.findOne(invoiceMatch).sort({ totalAmount: -1 })),
      populateInvoice(Invoice.find(invoiceMatch).sort({ purchaseDate: -1 }).limit(5)),
      Invoice.aggregate([
        { $match: invoiceMatch },
        { $group: { _id: '$vehicle', quantity: { $sum: '$quantity' }, sales: { $sum: '$totalAmount' } } },
        { $sort: { quantity: -1, sales: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
        { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
        { $project: { quantity: 1, sales: 1, make: '$vehicle.make', model: '$vehicle.model' } },
      ]),
      Invoice.aggregate([
        { $match: invoiceMatch },
        { $group: { _id: '$customer', invoices: { $sum: 1 }, sales: { $sum: '$totalAmount' } } },
        { $sort: { sales: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'customer' } },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        { $project: { invoices: 1, sales: 1, name: '$customer.name', email: '$customer.email' } },
      ]),
    ]);
    const overview = overviewRows[0] || {};

    res.status(200).json({
      success: true,
      data: {
        ...overview,
        totalUnits: overview.totalStock || 0,
        inventoryValue: overview.inventoryValue || 0,
        averageVehiclePrice: overview.averageVehiclePrice || 0,
        mostExpensiveVehicle: mostExpensive || null,
        cheapestVehicle: cheapest || null,
        highestStockVehicle: highestStock || null,
        lowestStockVehicle: lowestStock || null,
        vehicleCountByCategory: byCategory,
        vehicleCountByBrand: byBrand,
        latestVehicles,
        recentPurchases,
        recentActivity: activities,
        monthlyPurchases: monthlyPurchases.map((entry) => ({
          label: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`,
          purchases: entry.purchases,
          revenue: entry.revenue,
        })),
        invoiceStats: {
          totalSales: invoiceSummaryRows[0]?.totalSales || 0,
          todaySales: todaySalesRows[0]?.value || 0,
          monthlySales: monthlySalesRows[0]?.value || 0,
          averageInvoiceValue: invoiceSummaryRows[0]?.averageInvoiceValue || 0,
          invoiceCount: invoiceSummaryRows[0]?.invoiceCount || 0,
          highestInvoice: highestInvoice || null,
          recentInvoices,
          topSellingVehicles,
          topCustomers,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const populateInvoice = (query) => query
  .populate('customer', 'name email')
  .populate('vehicle', 'make model category');

module.exports = { inventoryAnalytics };
