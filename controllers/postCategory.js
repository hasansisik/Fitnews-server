const PostCategory = require('../models/postCategory');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create Post Category
const createPostCategory = async (req, res) => {
    try {
        const { title } = req.body;

        const postCategory = await PostCategory.create({
            title,
            author: req.user.userId
        });
        
        res.status(StatusCodes.CREATED).json({ postCategory });
    } catch (error) {
        console.error('Create Post Category Error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            msg: 'Kategori oluşturulurken bir hata oluştu',
            error: error.message 
        });
    }
};

// Get All Post Categories
const getAllPostCategories = async (req, res) => {
    try {
        const postCategories = await PostCategory.find()
            .sort({ createdAt: -1 })
            .populate('posts');

        res.status(StatusCodes.OK).json({ 
            postCategories, 
            count: postCategories.length 
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            msg: 'Kategoriler getirilirken bir hata oluştu',
            error: error.message 
        });
    }
};

// Delete Post Category
const deletePostCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const postCategory = await PostCategory.findById(id);
        
        if (!postCategory) {
            throw new CustomError.NotFoundError('Kategori bulunamadı');
        }

        await PostCategory.findByIdAndDelete(id);

        res.status(StatusCodes.OK).json({ 
            msg: 'Kategori başarıyla silindi' 
        });
    } catch (error) {
        console.error('Delete Post Category Error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            msg: 'Kategori silinirken bir hata oluştu',
            error: error.message 
        });
    }
};

module.exports = {
    createPostCategory,
    getAllPostCategories,
    deletePostCategory
};
