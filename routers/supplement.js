const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/supplement');

// Create a new supplement
router.post('/', supplementController.createSupplement);

// Get all supplements with updated prices
router.get('/', supplementController.getAllSupplements);

// Get supplements by type
router.get('/type/:type', supplementController.getSupplementsByType);

module.exports = router;