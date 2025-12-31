const express = require('express');
const router = express.Router();
const { getAbout, updateAbout } = require('../controllers/aboutController');

router.get('/', getAbout);
router.put('/', updateAbout);

module.exports = router;
// const express = require('express'); 

// Minimal about route - return a short static about payload
router.get('/', (req, res) => {
  res.json({
    success: true,
    about: {
      name: 'A3 Research',
      mission: 'Promoting open research and reproducible science',
    },
  });
});

module.exports = router;
