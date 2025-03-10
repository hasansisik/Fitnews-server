const mongoose = require('mongoose');

const PostCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Lütfen bir kategori başlığı giriniz'],
        trim: true
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PostCategory', PostCategorySchema);
