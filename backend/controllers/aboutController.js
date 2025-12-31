const About = require('../models/About');

exports.getAbout = async (req, res) => {
  try {
    const about = await About.findOne().lean();
    // eslint-disable-next-line no-console
    console.log('[aboutController] getAbout response:', JSON.stringify(about, null, 2));
    res.json(about);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch about info' });
  }
};

exports.updateAbout = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = new About(req.body);
    } else {
      // Update supported fields while preserving any others
      const fields = ['name','title','email','location','github','linkedin','bio','bioDescription','profilePicture','education','experience','researchInterests','achievements','content'];
      for (const f of fields) {
        if (Object.prototype.hasOwnProperty.call(req.body, f)) {
          about[f] = req.body[f];
        }
      }
    }
    await about.save();
    // Return plain object for consistency
    const plainAbout = about.toObject ? about.toObject() : about;
    // eslint-disable-next-line no-console
    console.log('[aboutController] updateAbout saved achievements:', JSON.stringify(plainAbout.achievements, null, 2));
    res.json(plainAbout);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update about info' });
  }
};
