// index_th.js - Express API for OpenChinaAPI (Thai Language + Short Link Decoder)

const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const API_TOKEN = 'ec3bdc1e65e7a2cb9a8248dd0e0c17fe7fd660d0';
const headers = { Authorization: `Token ${API_TOKEN}` };

// Root for health check
app.get('/', (req, res) => {
  res.send('🟢 Taobao Proxy API (TH) is running...');
});

// 1. SEARCH BY KEYWORD (Thai + Params)
app.get('/search/keyword', async (req, res) => {
  try {
    const { q = 'กระเป๋า', page = 1, page_size = 20, start_price, end_price, sort = 'desc' } = req.query;
    let url = `https://api.openchinaapi.com/v1/taobao/products?q=${encodeURIComponent(q)}&page=${page}&page_size=${page_size}&lang=th&sort=${sort}`;
    if (start_price) url += `&start_price=${start_price}`;
    if (end_price) url += `&end_price=${end_price}`;
    const response = await axios.get(url, { headers });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SEARCH BY IMAGE (Thai)
app.get('/search/image', async (req, res) => {
  try {
    const imgcode = 'http://g-search3.alicdn.com/img/bao/uploaded/i4/01CN01DpcD8IzHpbsH1gYJtJf2200811456689.jpg';
    const url = `https://api.openchinaapi.com/v1/taobao/search_img_vip?imgcode=${encodeURIComponent(imgcode)}&page=1&lang=th&page_size=20`;
    const response = await axios.get(url, { headers });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PRODUCT DETAIL (Thai)
app.get('/product/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const url = `https://api.openchinaapi.com/v1/taobao/products/${itemId}?lang=th`;
    const response = await axios.get(url, { headers });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.1. DECODE FROM FULL URL (Taobao or 1688)
app.get('/decode/full', async (req, res) => {
  try {
    const link = req.query.url;
    const match = link.match(/id=(\d{6,})|offer\/(\d{6,})/);
    const itemId = match ? match[1] || match[2] : null;
    if (!itemId) return res.status(400).json({ error: 'ไม่พบ item ID จากลิงก์นี้' });

    const is1688 = link.includes('1688.com');
    const apiType = is1688 ? '1688' : 'taobao';
    const detailUrl = `https://api.openchinaapi.com/v1/${apiType}/products/${itemId}?lang=th`;
    const detailRes = await axios.get(detailUrl, { headers });
    res.json(detailRes.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DECODE SHORT LINK - Taobao
app.get('/decode/taobao', async (req, res) => {
  try {
    const link = req.query.url;
    const url = `https://api.openchinaapi.com/v1/taobao/item_urlencode?word=${encodeURIComponent(link)}&title=no`;
    const decodeRes = await axios.get(url, { headers });
    const itemId = decodeRes.data?.data?.num_iid;
    if (itemId) {
      const detailUrl = `https://api.openchinaapi.com/v1/taobao/products/${itemId}?lang=th`;
      const detailRes = await axios.get(detailUrl, { headers });
      res.json(detailRes.data);
    } else {
      res.status(404).json({ error: 'ไม่สามารถแปลงลิงก์ Taobao ได้' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DECODE SHORT LINK - 1688
app.get('/decode/1688', async (req, res) => {
  try {
    const link = req.query.url;
    const url = `https://api.openchinaapi.com/v1/1688/item_urlencode?word=${encodeURIComponent(link)}&title=no`;
    const decodeRes = await axios.get(url, { headers });
    const itemId = decodeRes.data?.data?.num_iid;
    if (itemId) {
      const detailUrl = `https://api.openchinaapi.com/v1/1688/products/${itemId}?lang=th`;
      const detailRes = await axios.get(detailUrl, { headers });
      res.json(detailRes.data);
    } else {
      res.status(404).json({ error: 'ไม่สามารถแปลงลิงก์ 1688 ได้' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
