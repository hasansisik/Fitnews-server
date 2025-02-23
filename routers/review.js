const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviews,
  confirmReviews,
  deleteReview
} = require('../controllers/review');

const { isAuthenticated } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getReviews);
router.post('/post/:postId', createReview);
router.post('/confirm', confirmReviews);
router.post('/delete', deleteReview);

// Protected routes
router.use(isAuthenticated);
router.delete('/:id', deleteReview);

module.exports = router;
