const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  organization: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
