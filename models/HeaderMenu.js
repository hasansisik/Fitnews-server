const mongoose = require("mongoose");

const SubTitleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Alt başlık alanı zorunludur'],
    trim: true
  },
  urlPath: {
    type: String,
    required: [true, 'Alt URL alanı zorunludur'],
    trim: true,
  }
});

const HeaderMenuSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Başlık alanı zorunludur'],
    trim: true
  },
  urlPath: {
    type: String,
    required: [true, 'URL alanı zorunludur'],
    trim: true,
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subTitles: [SubTitleSchema]
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // URL'i / ile başlayacak şekilde döndür
      ret.fullUrl = `/${ret.urlPath}`;
      return ret;
    }
  }
});

// URL'in benzersiz olmasını sağla
HeaderMenuSchema.index({ urlPath: 1 }, { unique: true });

module.exports = mongoose.model('HeaderMenu', HeaderMenuSchema);
