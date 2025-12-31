const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

// create a case-insensitive index for name to help uniqueness checks if desired
CategorySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);
