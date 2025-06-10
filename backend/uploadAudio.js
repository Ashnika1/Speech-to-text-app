const fs = require('fs');
const axios = require('axios');
const path = require('path');
const axiosRetry = require('axios-retry');

// Add retry logic
axiosRetry(axios, { retries: 3 });

const uploadToAssemblyAI = async (audioFilePath) => {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.assemblyai.com/v2/upload',
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
        'transfer-encoding': 'chunked',
      },
      data: fs.createReadStream(audioFilePath),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('Upload success:', response.data);
    return response.data.upload_url;
  } catch (error) {
    console.error('Upload error:', error.message);
    throw error;
  }
};

module.exports = uploadToAssemblyAI;
