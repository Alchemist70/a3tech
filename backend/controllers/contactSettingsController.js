const ContactSettings = require('../models/ContactSettings');

exports.getContactSettings = async (req, res) => {
  try {
    const settings = await ContactSettings.findOne();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contact settings' });
  }
};

exports.updateContactSettings = async (req, res) => {
  try {
    let settings = await ContactSettings.findOne();
    if (!settings) {
      settings = new ContactSettings(req.body);
    } else {
      // Update supported fields
      const fields = ['name','email','organization','role','subject','message','type','infoEmail','infoLocation','infoInstitution','infoLab','responseGeneral','responseCollab','responseTech','lookingCollab','lookingIndustry','lookingAcademic','lookingInternship'];
      for (const f of fields) {
        if (Object.prototype.hasOwnProperty.call(req.body, f)) {
          settings[f] = req.body[f];
        }
      }
    }
    settings.updatedAt = new Date();
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact settings' });
  }
};
