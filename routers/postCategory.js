const express = require('express');
const router = express.Router();
const {
    createPostCategory,
    getAllPostCategories,
    deletePostCategory
} = require('../controllers/postCategory');

const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllPostCategories);

// Protected routes (Admin only)
router.use(isAuthenticated);
router.use(isAdmin);
router.post('/', createPostCategory);
router.delete('/:id', deletePostCategory);

module.exports = router;
