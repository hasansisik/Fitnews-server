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

const { isAuthenticated } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPost);

// Protected routes
router.post('/', isAuthenticated,createPost);
router.get('/user/posts', getUserPosts);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);
router.patch('/:id/order', updatePostOrder);
router.patch('/orders/bulk', updatePostOrders);

module.exports = router;