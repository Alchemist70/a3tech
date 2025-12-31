const express = require('express');
const router = express.Router();
const { getContactSettings, updateContactSettings } = require('../controllers/contactSettingsController');

// Settings endpoints (admin-facing)
router.get('/settings', getContactSettings);
router.put('/settings', updateContactSettings);

// Accept contact form submissions and respond with a success message.
router.post('/', (req, res) => {
  // In the restored minimal backend we won't persist messages. Log and return success.
  try {
    // eslint-disable-next-line no-console
    console.log('Contact submission received:', req.body);
  } catch (e) { }
  res.json({ success: true, message: 'Contact submission received' });
});

module.exports = router;

