const Review = require('../models/Review');
const Post = require('../models/Post');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create Review
const createReview = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment, nickname, email } = req.body;
    console.log(req.body);
    console.log(postId);

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
  } catch (error) {
    console.error('Create Review Error:', error);
    
    if (error instanceof CustomError.NotFoundError || error instanceof CustomError.BadRequestError) {
      res.status(error.statusCode).json({ msg: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Bir hata oluştu' });
    }
  }
};

// Get Post Reviews
const getPostReviews = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Yorumlar getirilirken bir hata oluştu' });
  }
};

// Update Review Status (Admin Only)
const updateReviewStatus = async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const { status } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new CustomError.NotFoundError('Yorum bulunamadı');
    }

    review.status = status;
    await review.save();

    res.status(StatusCodes.OK).json({ review });
  } catch (error) {
    if (error instanceof CustomError.NotFoundError) {
      res.status(error.statusCode).json({ msg: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Yorum durumu güncellenirken bir hata oluştu' });
    }
  }
};

// Delete Review (Admin Only)
const deleteReview = async (req, res) => {
  try {
    const { id: reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new CustomError.NotFoundError('Yorum bulunamadı');
    }

    // Post'un review sayısını güncelle
    const post = await Post.findById(review.post);
    if (post) {
      post.reviews = post.reviews.filter(id => id.toString() !== reviewId);
      post.reviewCount = post.reviews.length;
      await post.save();
    }

    await review.remove();
    res.status(StatusCodes.OK).json({ msg: 'Yorum başarıyla silindi' });
  } catch (error) {
    if (error instanceof CustomError.NotFoundError) {
      res.status(error.statusCode).json({ msg: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Yorum silinirken bir hata oluştu' });
    }
  }
};

module.exports = {
  createReview,
  getPostReviews,
  updateReviewStatus,
  deleteReview
};
