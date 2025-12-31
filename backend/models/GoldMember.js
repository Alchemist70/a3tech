const mongoose = require('mongoose');

const GoldMemberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  addedBy: { type: String }, // optional admin identifier
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('GoldMember', GoldMemberSchema);
