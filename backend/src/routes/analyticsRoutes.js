const express = require('express');
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { inventoryAnalytics } = require('../controllers/analyticsController');

const router = express.Router();
router.use(protect, adminOnly);
router.get('/inventory', inventoryAnalytics);

module.exports = router;
