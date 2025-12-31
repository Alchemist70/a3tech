const mongoose = require('mongoose');

const AboutSchema = new mongoose.Schema({
  // Profile Information
  name: { type: String, default: '' },
  title: { type: String, default: '' },
  email: { type: String, default: '' },
  location: { type: String, default: '' },
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  bio: { type: String, default: '' },
  bioDescription: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  
  // Arrays of items
  education: { type: Array, default: [] },
  experience: { type: Array, default: [] },
  researchInterests: { type: Array, default: [] },
  achievements: { type: Array, default: [] },
  
  // Legacy content field
  content: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('About', AboutSchema);
