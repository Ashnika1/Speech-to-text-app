const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('audio'), async (req, res) => {
  const filePath = req.file.path;

  try {
    const uploadRes = await axios({
      method: 'post',
      url: 'https://api.assemblyai.com/v2/upload',
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
        'transfer-encoding': 'chunked',
      },
      data: fs.createReadStream(filePath),
    });

    const audioUrl = uploadRes.data.upload_url;

    const transcriptRes = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      { audio_url: audioUrl },
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
        },
      }
    );

    res.json({ transcriptId: transcriptRes.data.id });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

module.exports = router;
