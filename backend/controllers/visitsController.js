const Visit = require('../models/Visit');

// Helper: normalize incoming fingerprint
const getFingerprint = (req) => {
  // client may send a fingerprint header or body field
  return req.headers['x-fingerprint'] || req.body && req.body.fingerprint || null;
};

// Record a visit for a given section: POST /api/visits/record { section }
exports.record = async (req, res) => {
  try {
    const section = req.body.section || 'projects';
    const ip = req.ip || req.connection && req.connection.remoteAddress || '';
    const fingerprint = getFingerprint(req);
    const query = { ip };
    if (fingerprint) query.fingerprint = fingerprint;
    let v = await Visit.findOne(query);
    if (!v) {
      v = new Visit({ ip, fingerprint });
    }
    await v.increment(section);
    res.json({ success: true, counts: v.counts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record visit', error: err.message || err });
  }
};

// Check visits for a section: GET /api/visits/check?section=projects
exports.check = async (req, res) => {
  try {
    const section = req.query.section || 'projects';
    const ip = req.ip || req.connection && req.connection.remoteAddress || '';
    const fingerprint = req.headers['x-fingerprint'] || null;
    const query = { ip };
    if (fingerprint) query.fingerprint = fingerprint;
    const v = await Visit.findOne(query);
    const count = v ? (v.counts[section] || 0) : 0;
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to check visits', error: err.message || err });
  }
};
