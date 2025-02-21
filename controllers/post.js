const Post = require('../models/Post');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create Post
const createPost = async (req, res) => {
  const { title, content, metadata, order } = req.body;

  const post = await Post.create({
    title,
    content,
    metadata,
    order: order || 0,
    author: {
      user: req.user.userId,
      name: req.user.name,
      picture: req.user.profile?.picture
    }
  });

  res.status(StatusCodes.CREATED).json({ post });
};

// Get All Posts
const getAllPosts = async (req, res) => {
  const { category, status, tag } = req.query;
  const queryObject = {};

  // Filtreleme
  if (category) {
    queryObject['metadata.category'] = category;
  }
  if (status) {
    queryObject['metadata.status'] = status;
  }
  if (tag) {
    queryObject['metadata.tags'] = tag;
  }

  // Önce order'a göre (büyükten küçüğe), sonra createdAt'e göre sırala
  const posts = await Post.find(queryObject)
    .sort({ order: -1, createdAt: -1 });
    
  res.status(StatusCodes.OK).json({ posts, count: posts.length });
};

// Get Single Post
const getPost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    throw new CustomError.NotFoundError('Post bulunamadı');
  }

  res.status(StatusCodes.OK).json({ post });
};

// Update Post
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, metadata, order } = req.body;

  const post = await Post.findById(id);

  if (!post) {
    throw new CustomError.NotFoundError('Post bulunamadı');
  }

  // Yetki kontrolü
  if (post.author.user.toString() !== req.user.userId && req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Bu işlem için yetkiniz yok');
  }

  post.title = title || post.title;
  if (content) {
    post.content.text = content.text || post.content.text;
    post.content.image = content.image || post.content.image;
  }
  if (metadata) {
    post.metadata.category = metadata.category || post.metadata.category;
    post.metadata.tags = metadata.tags || post.metadata.tags;
    // Status sadece admin tarafından değiştirilebilir
    if (metadata.status && req.user.role === 'admin') {
      post.metadata.status = metadata.status;
    }
  }
  // Order sadece admin tarafından değiştirilebilir
  if (typeof order === 'number' && req.user.role === 'admin') {
    post.order = order;
  }

  await post.save();
  res.status(StatusCodes.OK).json({ post });
};

// Delete Post
const deletePost = async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);

  if (!post) {
    throw new CustomError.NotFoundError('Post bulunamadı');
  }

  // Yetki kontrolü
  if (post.author.user.toString() !== req.user.userId && req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Bu işlem için yetkiniz yok');
  }

  await post.remove();
  res.status(StatusCodes.OK).json({ message: 'Post başarıyla silindi' });
};

// Get User Posts
const getUserPosts = async (req, res) => {
  const posts = await Post.find({ 'author.user': req.user.userId })
    .sort({ order: -1, createdAt: -1 });
  res.status(StatusCodes.OK).json({ posts, count: posts.length });
};

// Update Post Order (Admin Only)
const updatePostOrder = async (req, res) => {
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
};

// Bulk Update Post Orders (Admin Only)
const updatePostOrders = async (req, res) => {
  const { orders } = req.body;

  if (!Array.isArray(orders)) {
    throw new CustomError.BadRequestError('Sıralama listesi bir dizi olmalıdır');
  }

  const updates = orders.map(async ({ postId, order }) => {
    if (typeof order !== 'number') {
      throw new CustomError.BadRequestError('Sıralama değeri bir sayı olmalıdır');
    }
    
    return Post.findByIdAndUpdate(
      postId,
      { order },
      { new: true, runValidators: true }
    );
  });

  const updatedPosts = await Promise.all(updates);
  res.status(StatusCodes.OK).json({ posts: updatedPosts });
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