module.exports = function (req, res, next) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin role required' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
  return next();
};
