const Purchase = require('../models/Purchase');
const { parsePagination, paginationMeta } = require('../utils/pagination');

const getPurchases = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const filter = req.user.role === 'admin' ? {} : { customer: req.user._id };
    const [total, purchases] = await Promise.all([
      Purchase.countDocuments(filter),
      Purchase.find(filter)
        .populate('customer', 'name email')
        .populate('vehicle', 'make model imageUrl')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: purchases.length,
      pagination: paginationMeta(total, pagination),
      data: purchases,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPurchases };
