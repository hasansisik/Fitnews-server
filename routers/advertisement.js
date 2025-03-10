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
router.post('/', isAuthenticated, createAdvertisement);
router.get('/', getAllAdvertisements);
router.patch('/:id', isAuthenticated, updateAdvertisement);
router.delete('/:id', isAuthenticated, deleteAdvertisement);

module.exports = router;
