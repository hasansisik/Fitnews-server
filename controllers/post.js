const Post = require('../models/Post');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const User = require('../models/User');

// Create Post
const createPost = async (req, res) => {
  try {
    const { title, content, metadata, order } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new CustomError.NotFoundError('Kullanıcı bulunamadı');
    }

    const post = await Post.create({
      title,
      content,
      metadata,
      order: order || 0,
      author: req.user.userId
    });
    res.status(StatusCodes.CREATED).json({ post });
  } catch (error) {
    console.error('Create Post Error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Post oluşturulurken bir hata oluştu',
      error: error.message 
    });
  }
};

// Get All Posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('author');
      
    res.status(StatusCodes.OK).json({ posts, count: posts.length });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Postlar getirilirken bir hata oluştu',
      error: error.message 
    });
  }
};

// Get Single Post
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: 'reviews',
        select: 'reviewer comment createdAt status',
        options: { sort: { createdAt: -1 } }
      })
      .populate('author');
    
    if (!post) {
      throw new CustomError.NotFoundError('Post bulunamadı');
    }

    res.status(StatusCodes.OK).json({ post });
  } catch (error) {
    if (error instanceof CustomError.NotFoundError) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: error.message });
    } else {
      console.error('Get Post Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Post getirilirken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

// Update Post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, order } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      throw new CustomError.NotFoundError('Post bulunamadı');
    }
    // Yetki kontrolü
    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      throw new CustomError.UnauthorizedError('Bu işlem için yetkiniz yok');
    }

    post.title = title || post.title;
    if (content) {
      post.content.text = content.text || post.content.text;
      post.content.image = content.image || post.content.image;
    }
    if (metadata) {
      if (metadata.category !== undefined) post.metadata.category = metadata.category;
      if (metadata.tags !== undefined) post.metadata.tags = metadata.tags;
      if (metadata.status !== undefined) {
        post.metadata.status = metadata.status;
      }
          }
    // Order sadece admin tarafından değiştirilebilir
    if (typeof order === 'number' && req.user.role === 'admin') {
      post.order = order;
    }

    await post.save();
    res.status(StatusCodes.OK).json({ post });
  } catch (error) {
    if (error instanceof CustomError.NotFoundError) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: error.message });
    } else if (error instanceof CustomError.UnauthorizedError) {
      res.status(StatusCodes.UNAUTHORIZED).json({ msg: error.message });
    } else {
      console.error('Update Post Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Post güncellenirken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

// Delete Post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      throw new CustomError.NotFoundError('Post bulunamadı');
    }

    // Yetki kontrolü
    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      throw new CustomError.UnauthorizedError('Bu işlem için yetkiniz yok');
    }

    await Post.findByIdAndDelete(id);
    res.status(StatusCodes.OK).json({ message: 'Post başarıyla silindi' });
  } catch (error) {
    if (error instanceof CustomError.NotFoundError) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: error.message });
    } else if (error instanceof CustomError.UnauthorizedError) {
      res.status(StatusCodes.UNAUTHORIZED).json({ msg: error.message });
    } else {
      console.error('Delete Post Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Post silinirken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

// Get User Posts
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.userId })
      .sort({ order: -1, createdAt: -1 });
    res.status(StatusCodes.OK).json({ posts, count: posts.length });
  } catch (error) {
    console.error('Get User Posts Error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Kullanıcı postları getirilirken bir hata oluştu',
      error: error.message 
    });
  }
};

// Update Post Order (Admin Only)
const updatePostOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body;

    if (typeof order !== 'number') {
      throw new CustomError.BadRequestError('Sıralama değeri bir sayı olmalıdır');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw new CustomError.NotFoundError('Post bulunamadı');
    }

    post.order = order;
    await post.save();

    res.status(StatusCodes.OK).json({ post });
  } catch (error) {
    if (error instanceof CustomError.NotFoundError) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: error.message });
    } else if (error instanceof CustomError.BadRequestError) {
      res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    } else {
      console.error('Update Post Order Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Post sırası güncellenirken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

// Bulk Update Post Orders (Admin Only)
const updatePostOrders = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      throw new CustomError.BadRequestError('Sıralama listesi bir dizi olmalıdır');
    }

    const updates = items.map(async ({ id, order }) => {
      if (typeof order !== 'number') {
        throw new CustomError.BadRequestError('Sıralama değeri bir sayı olmalıdır');
      }
      
      return Post.findByIdAndUpdate(
        id,
        { order },
        { new: true, runValidators: true }
      );
    });

    const updatedPosts = await Promise.all(updates);
    
    // Sort the posts by order before sending back
    updatedPosts.sort((a, b) => a.order - b.order);
    
    res.status(StatusCodes.OK).json({ posts: updatedPosts });
  } catch (error) {
    if (error instanceof CustomError.BadRequestError) {
      res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    } else {
      console.error('Update Post Orders Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Post sıraları güncellenirken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
  getUserPosts,
  updatePostOrder,
  updatePostOrders
};