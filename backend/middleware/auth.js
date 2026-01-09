// Thin compatibility shim for routes expecting '../middleware/auth'
module.exports = {
  authMiddleware: require('./authMiddleware'),
};
