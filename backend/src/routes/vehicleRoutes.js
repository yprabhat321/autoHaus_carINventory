const express = require('express');
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const {
  createVehicle,
  getVehicles,
  searchVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
} = require('../controllers/vehicleController');

const router = express.Router();

// Every vehicle route requires a valid, logged-in user.
router.use(protect);

// NOTE: '/search' must be declared before the '/:id' routes, otherwise
// Express would try to interpret the literal word "search" as an :id.
router.get('/search', searchVehicles);

router.route('/').get(getVehicles).post(adminOnly, createVehicle);

router.post('/:id/purchase', purchaseVehicle);
router.post('/:id/restock', adminOnly, restockVehicle);

router
  .route('/:id')
  .get(getVehicleById)
  .put(adminOnly, updateVehicle)
  .delete(adminOnly, deleteVehicle);

module.exports = router;
