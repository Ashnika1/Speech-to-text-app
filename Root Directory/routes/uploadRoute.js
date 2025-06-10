const express = require('express');
const multer = require('multer');
const path = require('path');
const uploadToAssemblyAI = require('../uploadAudio');

const router = express.Router();

// Configure multer for storing uploads in "uploads/" folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const uploadUrl = await uploadToAssemblyAI(filePath);
    res.json({ uploadUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

module.exports = router;
