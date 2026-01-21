const Lab = require('../models/Lab');
const { v4: uuidv4 } = require('uuid');

// Get all labs
exports.getAllLabs = async (req, res) => {
  try {
    const labs = await Lab.find().sort({ subject: 1, order: 1 });
    res.json(labs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get labs by subject
exports.getLabsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const labs = await Lab.find({ subject }).sort({ order: 1 });
    res.json(labs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single lab by ID
exports.getLabById = async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    res.json(lab);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new lab
exports.createLab = async (req, res) => {
  const { subject, title, slug, description, objectives, materials, procedure, precautions, observations, calculations, resultTemplate, simulationContent, images, order } = req.body;

  if (!subject || !title || !slug || !description) {
    return res.status(400).json({ message: 'Subject, title, slug, and description are required' });
  }

  const lab = new Lab({
    subject,
    title,
    slug,
    description,
    objectives: objectives || [],
    materials: materials || [],
    procedure: procedure || '',
    precautions: precautions || [],
    observations: observations || '',
    calculations: calculations || '',
    resultTemplate: resultTemplate || '',
    simulationContent: simulationContent || '',
    images: images || [],
    order: order || 0,
    uuid: uuidv4()
  });

  try {
    const savedLab = await lab.save();
    res.status(201).json({ success: true, data: savedLab, message: 'Lab created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Slug already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update lab
exports.updateLab = async (req, res) => {
  try {
    const { subject, title, slug, description, objectives, materials, procedure, precautions, observations, calculations, resultTemplate, simulationContent, images, order } = req.body;

    const lab = await Lab.findByIdAndUpdate(
      req.params.id,
      {
        subject,
        title,
        slug,
        description,
        objectives: objectives || [],
        materials: materials || [],
        procedure: procedure || '',
        precautions: precautions || [],
        observations: observations || '',
        calculations: calculations || '',
        resultTemplate: resultTemplate || '',
        simulationContent: simulationContent || '',
        images: images || [],
        order: order || 0,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    res.json({ success: true, data: lab, message: 'Lab updated successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Slug already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete lab
exports.deleteLab = async (req, res) => {
  try {
    const lab = await Lab.findByIdAndDelete(req.params.id);
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    res.json({ success: true, message: 'Lab deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
