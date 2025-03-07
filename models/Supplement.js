const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  productLink: {
    type: String,
    required: true,
    trim: true,
  },
  scale: {
    type: Number,
  },
});

const supplementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: String,
  },
  category: {
    type: String,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  averagePrice: {
    type: Number,
    required: true,
  },
  brands: [brandSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Supplement = mongoose.model("Supplement", supplementSchema);

module.exports = Supplement;
