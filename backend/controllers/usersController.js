const User = require('../models/User');
const GoldMember = require('../models/GoldMember');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: err.message || err });
  }
};

// Get all registered users (non-admin) with their Gold Member status
// This is for admin use only to manage subscriptions
exports.getUsersWithGoldMemberStatus = async (req, res) => {
  try {
    // Get all non-admin users
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password -secretCode -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    // Get all gold member emails as a Set for quick lookup
    const goldMembers = await GoldMember.find({});
    const goldMemberEmails = new Set(goldMembers.map(gm => gm.email.toLowerCase()));

    // Combine user data with gold member status
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      const isGoldMember = goldMemberEmails.has(user.email.toLowerCase());
      const goldMemberInfo = goldMembers.find(gm => gm.email.toLowerCase() === user.email.toLowerCase());
      
      return {
        ...userObj,
        isGoldMember,
        goldMemberId: goldMemberInfo?._id || null,
        goldMemberAddedAt: goldMemberInfo?.createdAt || null
      };
    });

    res.json({ success: true, data: usersWithStatus });
  } catch (err) {
    console.error('Error fetching users with gold member status:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users with gold member status', 
      error: err.message || err 
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: err.message || err });
  }
};

// Get current authenticated user's profile with premium status
// Called by frontend to verify subscription status
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Get user data
    const user = await User.findById(req.user._id).select('-password -secretCode -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is also a gold member
    const goldMember = await GoldMember.findOne({ email: user.email.toLowerCase() });
    
    const userData = user.toObject();
    userData.isGoldMember = !!goldMember;
    userData.isPremium = user.isSubscribed || !!goldMember;

    res.json({ success: true, data: userData });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ success: false, message: 'Error fetching profile', error: err.message || err });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing required fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
    const user = new User({ name, email, password, role });
    await user.save();
    const out = user.toObject();
    delete out.password;
    res.status(201).json({ success: true, data: out });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Error creating user', error: err.message || err });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (update.password) delete update.password; // password changes should go through separate flow
    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Error updating user', error: err.message || err });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting user', error: err.message || err });
  }
};
// Subscribe a user to premium membership
// Requires authentication
exports.subscribe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Update the user's subscription status
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isSubscribed: true },
      { new: true }
    ).select('-password -secretCode -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: 'Successfully subscribed to premium membership',
      data: user 
    });
  } catch (err) {
    console.error('Error subscribing user:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating subscription status', 
      error: err.message || err 
    });
  }
};

// Update authenticated user's profile (for general updates like profilePhoto)
// Requires authentication
exports.updateAuthenticatedUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { profilePhoto } = req.body;

    // Only allow updating profilePhoto field
    const updateData = {};
    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields to update' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password -secretCode -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: 'User updated successfully',
      data: user 
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user', 
      error: err.message || err 
    });
  }
};

// Update user profile (educational and location information)
// Requires authentication
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { schoolName, schoolEmail, educationLevel, purpose, address, city, country } = req.body;

    // Check if all required fields are provided
    if (!schoolName || !schoolEmail || !educationLevel || !purpose || !address || !city || !country) {
      return res.status(400).json({ 
        success: false, 
        message: 'All profile fields are required' 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if profile is already locked
    if (user.profileLocked) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your profile has been locked and cannot be changed' 
      });
    }

    // Update profile fields and lock the profile
    user.schoolName = schoolName;
    user.schoolEmail = schoolEmail;
    user.educationLevel = educationLevel;
    user.purpose = purpose;
    user.address = address;
    user.city = city;
    user.country = country;
    user.profileLocked = true; // Lock the profile after first save

    await user.save();

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.secretCode;

    res.json({ 
      success: true, 
      message: 'Profile updated and locked successfully',
      data: userObj 
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating profile', 
      error: err.message || err 
    });
  }
};