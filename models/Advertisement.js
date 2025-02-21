const mongoose = require("mongoose");

const AdvertisementSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'Görsel linki zorunludur']
  },
  page: {
    type: String,
    required: [true, 'Sayfa alanı zorunludur'],
    enum: {
      values: ['home', 'post', 'markets'],
      message: '{VALUE} geçerli bir sayfa değil'
    }
  },
  type: {
    type: String,
    required: [true, 'Tip alanı zorunludur'],
    enum: {
      values: ['top', 'bottom'],
      message: '{VALUE} geçerli bir tip değil'
    }
  }
}, { timestamps: true });

// Aynı sayfa ve tipte sadece bir reklam olabilir
AdvertisementSchema.index({ page: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Advertisement', AdvertisementSchema);
