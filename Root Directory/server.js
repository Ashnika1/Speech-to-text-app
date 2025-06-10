const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

app.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const audioPath = req.file.path;
    console.log("Audio file received");

    const uploadRes = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      fs.createReadStream(audioPath),
      {
        headers: {
          'authorization': process.env.ASSEMBLYAI_API_KEY,
          'transfer-encoding': 'chunked',
        },
      }
    );

    const audioUrl = uploadRes.data.upload_url;
    console.log('Audio uploaded to AssemblyAI:', audioUrl);

    const transcriptRes = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      { audio_url: audioUrl },
      {
        headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
      }
    );

    const transcriptId = transcriptRes.data.id;
    let completed = false;
    let transcriptText = '';

    while (!completed) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const pollingRes = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
        }
      );

      if (pollingRes.data.status === 'completed') {
        transcriptText = pollingRes.data.text;
        completed = true;
        console.log('Transcription complete');
      } else if (pollingRes.data.status === 'error') {
        throw new Error('Transcription failed: ' + pollingRes.data.error);
      }
    }

    res.json({ transcript: transcriptText });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
