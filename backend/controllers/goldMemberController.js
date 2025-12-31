const GoldMember = require('../models/GoldMember');
const { isAdmin } = require('../middleware/authMiddleware');

// Get all gold members
exports.getAllGoldMembers = async (req, res) => {
  try {
    const members = await GoldMember.find({}).sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    console.error('Error fetching gold members:', error);
    res.status(500).json({ message: 'Error fetching gold members' });
  }
};

// Add a new gold member
exports.addGoldMember = async (req, res) => {
  try {
    const { email, notes } = req.body;
    
    // Check if member already exists
    const existingMember = await GoldMember.findOne({ email: email.toLowerCase() });
    if (existingMember) {
      return res.status(400).json({ message: 'Member already exists' });
    }

    const member = new GoldMember({
      email: email.toLowerCase(),
      addedBy: req.user.email, // From auth middleware
      notes
    });

    await member.save();
    res.status(201).json(member);
  } catch (error) {
    console.error('Error adding gold member:', error);
    res.status(500).json({ message: 'Error adding gold member' });
  }
};

// Remove a gold member
exports.removeGoldMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await GoldMember.findByIdAndDelete(id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing gold member:', error);
    res.status(500).json({ message: 'Error removing gold member' });
  }
};

// Update gold member notes
exports.updateGoldMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const member = await GoldMember.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json(member);
  } catch (error) {
    console.error('Error updating gold member:', error);
    res.status(500).json({ message: 'Error updating gold member' });
  }
};