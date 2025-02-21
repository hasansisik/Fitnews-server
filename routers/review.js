const express = require('express');
const router = express.Router();
const {
  createReview,
  getPostReviews,
  updateReviewStatus,
  deleteReview
} = require('../controllers/review');

const { isAuthenticated } = require('../middleware/authMiddleware');

// Public routes
router.get('/post/:postId', getPostReviews);
router.post('/post/:postId', createReview);

// Protected routes
router.use(isAuthenticated);
router.patch('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);

module.exports = router;
