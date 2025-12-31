const mongoose = require('mongoose');

const contactSettingsSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  organization: { type: String, default: '' },
  role: { type: String, default: '' },
  subject: { type: String, default: '' },
  message: { type: String, default: '' },
  type: { type: String, default: 'general' },
  infoEmail: { type: String, default: '' },
  infoLocation: { type: String, default: '' },
  infoInstitution: { type: String, default: '' },
  infoLab: { type: String, default: '' },
  responseGeneral: { type: String, default: '' },
  responseCollab: { type: String, default: '' },
  responseTech: { type: String, default: '' },
  lookingCollab: { type: String, default: '' },
  lookingIndustry: { type: String, default: '' },
  lookingAcademic: { type: String, default: '' },
  lookingInternship: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactSettings', contactSettingsSchema);
