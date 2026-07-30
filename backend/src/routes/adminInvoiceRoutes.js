const express = require('express');
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { getAllInvoices, softDeleteInvoice } = require('../controllers/invoiceController');

const router = express.Router();
router.use(protect, adminOnly);
router.route('/').get(getAllInvoices);
router.delete('/:id', softDeleteInvoice);

module.exports = router;
