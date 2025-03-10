const express = require('express');
const router = express.Router();
const {
  createMenuItem,
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
  updateMenuOrders
} = require('../controllers/headerMenu');

const { isAuthenticated } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllMenuItems);

// Protected routes
router.use(isAuthenticated);
router.post('/', createMenuItem);
router.patch('/orders/bulk', updateMenuOrders);
router.patch('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);

module.exports = router;
