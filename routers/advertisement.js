const express = require('express');
const router = express.Router();
const {
  createAdvertisement,
  getAllAdvertisements,
  getPageAdvertisements,
  updateAdvertisement,
  deleteAdvertisement
} = require('../controllers/advertisement');

const { isAuthenticated } = require('../middleware/authMiddleware');

// Public routes
router.get('/page/:page', getPageAdvertisements);

// Protected routes
router.use(isAuthenticated);
router.post('/', createAdvertisement);
router.get('/', getAllAdvertisements);
router.patch('/:id', updateAdvertisement);
router.delete('/:id', deleteAdvertisement);

module.exports = router;
