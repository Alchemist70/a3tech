const mongoose = require('mongoose');

const BlogLikeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one like per user per blog
BlogLikeSchema.index({ userId: 1, blogId: 1 }, { unique: true });

module.exports = mongoose.model('BlogLike', BlogLikeSchema);
