const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
  getUserPosts,
  updatePostOrder,
  updatePostOrders
} = require('../controllers/post');

const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPost);

// Protected routes
router.use(isAuthenticated);
router.post('/', createPost);
router.get('/user/posts', getUserPosts);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);

// Admin only routes
router.patch('/:id/order', isAdmin, updatePostOrder);
router.patch('/orders/bulk', isAdmin, updatePostOrders);

module.exports = router;