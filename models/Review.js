const mongoose = require("mongoose");

const ReviewerSchema = new mongoose.Schema({
  isRegistered: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  nickname: {
    type: String,
    required: function() {
      return !this.isRegistered;
    },
    trim: true
  },
  email: {
    type: String,
    required: function() {
      return !this.isRegistered;
    },
    trim: true,
    lowercase: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Lütfen geçerli bir email adresi girin',
    ]
  }
});

const ReviewSchema = new mongoose.Schema({
  reviewer: ReviewerSchema,
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  comment: {
    type: String,
    required: [true, 'Yorum alanı zorunludur'],
    trim: true,
    maxlength: [500, 'Yorum 500 karakterden uzun olamaz']
  },
  status: {
    type: String,
    enum: {
      values: ['onaylandı', 'onaylanmadı', 'beklemede'],
      message: '{VALUE} geçerli bir durum değil'
    },
    default: 'beklemede'
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
