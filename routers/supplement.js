const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/supplement');

// Create a new supplement
router.post('/', supplementController.createSupplement);

// Get all supplements with updated prices
router.get('/', supplementController.getAllSupplements);

// Get supplements by type
router.get('/type/:type', supplementController.getSupplementsByType);

// Update a supplement
router.put('/:id', supplementController.updateSupplement);

// Delete a supplement
router.delete('/:id', supplementController.deleteSupplement);

module.exports = router;