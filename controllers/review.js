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


    const user = await User.findOne({ email: email });

    // Eğer kullanıcı giriş yapmışsa
    if (user) {
      // Kullanıcı bilgilerini al
      reviewData.reviewer = {
        isRegistered: true,
        user: user._id,
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


// Get All Reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate({
        path: 'post',
        select: 'title'
      })
      .sort('-createdAt');

    res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
  } catch (error) {
    console.error('Get Reviews Error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Yorumları getirirken bir hata oluştu' });
  }
};

// Yorumları onaylama veya reddetme
const confirmReviews = async (req, res) => {
  try {
    const { reviewIds, status } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds) || !status) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz istek. Review ID'leri ve status gerekli."
      });
    }

    if (!["onaylandı", "onaylanmadı"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz status değeri. 'onaylandı' veya 'onaylanmadı' olmalı."
      });
    }

    // Birden fazla yorumu güncelle
    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      { $set: { status: status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek yorum bulunamadı."
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} yorum başarıyla güncellendi.`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Yorumları onaylama hatası:", error);
    res.status(500).json({
      success: false,
      message: "Yorumları onaylarken bir hata oluştu.",
      error: error.message
    });
  }
};

// Delete Review
const deleteReview = async (req, res) => {
  try {
    const { reviewIds } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz istek. Review ID'leri gerekli."
      });
    }

    // Birden fazla yorumu sil
    const result = await Review.deleteMany({ _id: { $in: reviewIds } });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Silinecek yorum bulunamadı."
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} yorum başarıyla silindi.`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Yorumları silme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Yorumları silerken bir hata oluştu.",
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getReviews,
  confirmReviews,
  deleteReview
};
