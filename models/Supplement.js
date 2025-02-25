const mongoose = require('mongoose');

const supplementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    averagePrice: {
        type: Number,
        required: true
    },
    brands: [{
        brandName: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true
        },
        productLink: {
            type: String,
            required: true,
            trim: true
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Supplement = mongoose.model('Supplement', supplementSchema);

module.exports = Supplement;