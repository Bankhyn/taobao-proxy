// ✅ index.js (แก้ไขใหม่ให้ใช้ openchinaapi.com ตรง)

const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🟢 Taobao Unshortener Proxy is live!');
});

app.get('/unshorten', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ success: false, error: 'Missing URL' });

  try {
    const apiUrl = `https://api.openchinaapi.com/v3/advance/products/?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: 'Token ec3bdc1e65e7a2cb9a8248dd0e0c17fe7fd660d0'
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
