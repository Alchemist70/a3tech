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
    // Construct fileUrl: use BACKEND_PUBLIC_URL env var in PRODUCTION only,
    // otherwise fall back to req protocol/host (for local dev).
    let fileUrl;
    const isProduction = process.env.NODE_ENV === 'production';
    const backendPublicUrl = isProduction ? (process.env.BACKEND_PUBLIC_URL || process.env.API_PUBLIC_URL || '') : '';
    
    if (backendPublicUrl) {
      // Use explicitly configured public backend URL for production
      const base = String(backendPublicUrl).trim();
      fileUrl = base.endsWith('/') ? `${base}uploads/${filename}` : `${base}/uploads/${filename}`;
    } else {
      // Fall back to dynamic construction from request (local dev or if env var not set)
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    }
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
    
    // Construct fileUrl: use BACKEND_PUBLIC_URL env var in PRODUCTION only,
    // otherwise fall back to req protocol/host (for local dev).
    let url;
    const isProduction = process.env.NODE_ENV === 'production';
    const backendPublicUrl = isProduction ? (process.env.BACKEND_PUBLIC_URL || process.env.API_PUBLIC_URL || '') : '';
    
    if (backendPublicUrl) {
      const base = String(backendPublicUrl).trim();
      url = base.endsWith('/') ? `${base}uploads/${filename}` : `${base}/uploads/${filename}`;
    } else {
      url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    }
    return res.json({ success: true, url });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// POST /api/uploads/image-blob - Upload image and return as BLOB for database storage
// This endpoint reads the uploaded file and returns it as base64-encoded BLOB data
router.post('/image-blob', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    
    // Read the file and convert to base64
    const filePath = req.file.path;
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    
    // Determine mime type from file extension or Content-Type header
    const mimeType = req.file.mimetype || 'application/octet-stream';
    
    // Return BLOB data (as base64 string for JSON transfer)
    res.json({
      success: true,
      data: {
        type: 'blob',
        data: base64Data,
        mimeType: mimeType,
        size: req.file.size,
        filename: req.file.filename,
        originalName: req.file.originalname,
      }
    });
    
    // Clean up the uploaded file from disk (since we're storing in DB as BLOB)
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('image-blob upload error', err);
    return res.status(500).json({ success: false, error: 'Upload failed', message: err.message || err });
  }
});

module.exports = router;
