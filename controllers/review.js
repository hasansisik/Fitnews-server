const Review = require('../models/Review');
const Post = require('../models/Post');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create Review
const createReview = async (req, res) => {
  const { postId } = req.params;
  const { comment, nickname, email } = req.body;

  // Post kontrolü
  const post = await Post.findById(postId);
  if (!post) {
    throw new CustomError.NotFoundError('Post bulunamadı');
  }

  let reviewData = {
    post: postId,
    comment,
    reviewer: {}
  };

  // Eğer kullanıcı giriş yapmışsa
  if (req.user) {
    const user = await User.findById(req.user.userId);
    reviewData.reviewer = {
      isRegistered: true,
      user: req.user.userId,
      nickname: user.name,
      email: user.email
    };
  } else {
    // Kayıtsız kullanıcı için
    if (!nickname || !email) {
      throw new CustomError.BadRequestError('Nickname ve email zorunludur');
    }
    reviewData.reviewer = {
      isRegistered: false,
      nickname,
      email
    };
  }

  const review = await Review.create(reviewData);
  
  // Post'un review sayısını güncelle
  post.reviews.push(review._id);
  post.reviewCount = post.reviews.length;
  await post.save();

  res.status(StatusCodes.CREATED).json({ review });
};

// Get Post Reviews
const getPostReviews = async (req, res) => {
  const { postId } = req.params;
  const { status } = req.query;

  const queryObject = { post: postId };
  
  // Admin için tüm yorumları getir
  if (req.user?.role === 'admin' && status) {
    queryObject.status = status;
  } else {
    // Normal kullanıcılar için sadece onaylanmış yorumları getir
    queryObject.status = 'onaylandı';
  }

  const reviews = await Review.find(queryObject).sort('-createdAt');
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

// Update Review Status (Admin Only)
const updateReviewStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    throw new CustomError.NotFoundError('Yorum bulunamadı');
  }

  review.status = status;
  await review.save();

  res.status(StatusCodes.OK).json({ review });
};

// Delete Review (Admin Only)
const deleteReview = async (req, res) => {
  const { id } = req.params;
  
  const review = await Review.findById(id);
  if (!review) {
    throw new CustomError.NotFoundError('Yorum bulunamadı');
  }

  // Post'un review sayısını güncelle
  const post = await Post.findById(review.post);
  if (post) {
    post.reviews = post.reviews.filter(reviewId => reviewId.toString() !== id);
    post.reviewCount = post.reviews.length;
    await post.save();
  }

  await review.remove();
  res.status(StatusCodes.OK).json({ message: 'Yorum başarıyla silindi' });
};

module.exports = {
  createReview,
  getPostReviews,
  updateReviewStatus,
  deleteReview
};
