import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

export const transcribeAudio = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('https://api.assemblyai.com/v2/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        authorization: ASSEMBLYAI_API_KEY,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const uploadUrl = response.data.upload_url;
    res.status(200).json({ uploadUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to upload audio' });
  }
};
