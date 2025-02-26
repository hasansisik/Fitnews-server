const mongoose = require("mongoose");

const AdvertisementSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: [true, 'Görsel linki zorunludur']
  },
  link: {
    type: String,
    required: false
  },
  page: {
    type: String,
    required: [true, 'Sayfa alanı zorunludur'],
    enum: {
      values: ['home', 'post', 'markets', 'category'],
      message: '{VALUE} geçerli bir sayfa değil'
    }
  },
  type: {
    type: String,
    required: [true, 'Tip alanı zorunludur'],
    enum: {
      values: ['big', 'small'],
      message: '{VALUE} geçerli bir tip değil'
    }
  }
}, { timestamps: true });

// Aynı sayfa ve tipte sadece bir reklam olabilir
AdvertisementSchema.index({ page: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Advertisement', AdvertisementSchema);
