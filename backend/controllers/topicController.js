const Topic = require('../models/Topic');
const Visit = require('../models/Visit');
const User = require('../models/User');
const GoldMember = require('../models/GoldMember');

exports.getTopics = async (req, res) => {
  try {
    const topics = await Topic.find();
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
};

exports.getTopicBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const topic = await Topic.findOne({ slug });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    // gating: anonymous allowed only 2 topic views, logged-in non-subscribed/gold see only first content
    const token = req.headers['x-auth-token'] || (req.headers.authorization && String(req.headers.authorization).split(' ')[1]);
    let user = null;
    if (token) user = await User.findOne({ token });

    if (!user) {
      const ip = req.ip || req.connection && req.connection.remoteAddress || '';
      const fingerprint = req.headers['x-fingerprint'] || null;
      const query = { ip };
      if (fingerprint) query.fingerprint = fingerprint;
      const v = await Visit.findOne(query);
      const count = v ? (v.counts.topics || 0) : 0;
      if (count >= 2) return res.status(403).json({ success: false, message: 'Registration required', requireRegistration: true });
      try {
        if (v) await v.increment('topics');
        else {
          const nv = new Visit({ ip, fingerprint });
          await nv.increment('topics');
        }
      } catch (e) { }
      // return first content only for anonymous
      const first = extractFirstParagraph(topic.content || '');
      return res.json({ success: true, data: { _id: topic._id, name: topic.name, slug: topic.slug, content: first } });
    }

    // user present
    if (user.isSubscribed) return res.json(topic);
    const gm = await GoldMember.findOne({ email: user.email });
    if (gm) return res.json(topic);
    // logged in but not subscribed: show first content only
    const first = extractFirstParagraph(topic.content || '');
    return res.json({ success: true, data: { _id: topic._id, name: topic.name, slug: topic.slug, content: first } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
};

function extractFirstParagraph(text) {
  if (!text) return '';
  // split by double newline or by single newline, fallback to first sentence
  const parts = text.split(/\r?\n\r?\n/).map(p => p.trim()).filter(Boolean);
  if (parts.length) return parts[0];
  const lineParts = text.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
  if (lineParts.length) return lineParts[0];
  const sent = text.split('.').map(s => s.trim()).filter(Boolean);
  return sent.length ? (sent[0] + (sent[0].endsWith('.') ? '' : '.')) : text;
}
