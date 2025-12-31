const GoldMember = require('../models/GoldMember');
const User = require('../models/User');

// Check if a user has premium access (either gold member or subscribed)
exports.checkGoldMember = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check for gold member status
    const member = await GoldMember.findOne({ email: req.user.email.toLowerCase() });
    if (member) {
      return res.json({ isGold: true });
    }

    // If not a gold member, check subscription status
    const user = await User.findById(req.user._id);
    if (user && user.isSubscribed) {
      return res.json({ isGold: true });
    }

    // Neither gold member nor subscribed
    return res.json({ isGold: false });

  } catch (error) {
    console.error('Error checking premium access status:', error);
    res.status(500).json({ message: 'Error checking premium access status' });
  }
};