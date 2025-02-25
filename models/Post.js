const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: [true, 'İçerik alanı zorunludur'],
    trim: true 
  },
  image: {
    type: String,
    required: [true, 'Görsel alanı zorunludur']
  }
});

const MetadataSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Kategori alanı zorunludur']
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: {
      values: ['onaylandı', 'onaylanmadı', 'beklemede'],
      message: '{VALUE} geçerli bir durum değil'
    },
    default: 'beklemede'
  }
});



const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Başlık alanı zorunludur'],
      trim: true,
      maxlength: [100, 'Başlık 100 karakterden uzun olamaz']
    },
    content: ContentSchema,    // İçerik alt şeması
    metadata: MetadataSchema, // Metadata alt şeması
    author: {                 // Yazar alt şeması
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Yazar alanı zorunludur']
    },
    reviews: [{               // Yorumlar
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }],
    reviewCount: {           // Yorum sayısı
      type: Number,
      default: 0
    },
    order: {                // Sıralama için alan
      type: Number,
      default: 0            // 0: Normal sıra, pozitif: öne çık, negatif: arkaya at
    }
  },
  { timestamps: true }
);

// Virtual populate için reviews
PostSchema.virtual('postReviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'post',
  match: { status: 'onaylandı' } // Sadece onaylanmış yorumları getir
});

// toJSON ve toObject ayarları
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', PostSchema);