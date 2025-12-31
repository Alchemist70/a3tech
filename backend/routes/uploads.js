const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const name = `${Date.now()}-${Math.random().toString(36).substr(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// POST /api/uploads - Generic file upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const filename = req.file.filename;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    return res.json({ success: true, data: { fileUrl, filename } });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message || err });
  }
});

// POST /api/uploads/profile-picture
router.post('/profile-picture', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const filename = req.file.filename;
    const url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    return res.json({ success: true, url });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

module.exports = router;
