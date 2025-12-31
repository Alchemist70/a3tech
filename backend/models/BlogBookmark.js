const mongoose = require('mongoose');

const BlogBookmarkSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  description: String,
  bookmarkedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one bookmark per user per blog
BlogBookmarkSchema.index({ userId: 1, blogId: 1 }, { unique: true });

module.exports = mongoose.model('BlogBookmark', BlogBookmarkSchema);
