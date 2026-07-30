const express = require('express');
const protect = require('../middleware/auth');
const { getPurchases } = require('../controllers/purchaseController');

const router = express.Router();

router.use(protect);
router.get('/', getPurchases);

module.exports = router;
