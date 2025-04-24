// 📁 index.js (Node.js Proxy Server for Taobao Unshorten via WhaleKub)

const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/unshorten', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ success: false, error: 'Missing URL' });

  try {
    const response = await axios.get(`https://openchinaapi.whalekub.com/unshorten?url=${encodeURIComponent(url)}`, {
      headers: {
        Authorization: `Token ${process.env.WHALEKUB_TOKEN}`
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
