const express = require('express');
const protect = require('../middleware/auth');
const { getInvoices, getInvoice, downloadInvoice } = require('../controllers/invoiceController');

const router = express.Router();
router.use(protect);
router.get('/', getInvoices);
router.get('/:id/download', downloadInvoice);
router.get('/:id', getInvoice);

module.exports = router;
