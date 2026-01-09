const SebTemplate = require('../models/SebTemplate');

// Create a new template (admin only)
exports.createTemplate = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { name, description, templateXml, mockTestId } = req.body;
    const t = new SebTemplate({ name, description, templateXml, mockTestId, createdBy: req.user._id });
    await t.save();
    res.json({ success: true, template: t });
  } catch (error) {
    console.error('Error creating SEB template:', error);
    res.status(500).json({ error: error.message });
  }
};

// List templates (admin)
exports.listTemplates = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const templates = await SebTemplate.find().sort({ updatedAt: -1 });
    res.json({ templates });
  } catch (error) {
    console.error('Error listing SEB templates:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get template by id
exports.getTemplate = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { id } = req.params;
    const template = await SebTemplate.findById(id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ template });
  } catch (error) {
    console.error('Error getting SEB template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { id } = req.params;
    const update = req.body;
    const template = await SebTemplate.findByIdAndUpdate(id, update, { new: true });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating SEB template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { id } = req.params;
    await SebTemplate.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting SEB template:', error);
    res.status(500).json({ error: error.message });
  }
};
