// index.js
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app     = express();
const port    = process.env.PORT || 3000;

// ใส่ API_TOKEN ของคุณตรงนี้
const API_TOKEN = 'ec3bdc1e65e7a2cb9a8248dd0e0c17fe7fd660d0';
const headers   = { Authorization: `Token ${API_TOKEN}` };

// เปิด CORS ให้ดึงข้อมูลจาก Wix ได้
app.use(cors());

// Health-check
app.get('/', (req, res) => {
  res.send('🟢 Taobao Proxy API (TH) is running...');
});

// 1. SEARCH BY KEYWORD (Thai + Params)
app.get('/search/keyword', async (req, res) => {
  try {
    const {
      q = 'กระเป๋า',
      page = 1,
      page_size = 20,
      start_price,
      end_price,
      sort = 'desc'
    } = req.query;

    let url = `https://api.openchinaapi.com/v1/taobao/products?lang=th&q=${encodeURIComponent(q)}&page=${page}&page_size=${page_size}&sort=${sort}`;
    if (start_price) url += `&start_price=${start_price}`;
    if (end_price)   url += `&end_price=${end_price}`;

    const response = await axios.get(url, { headers });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SEARCH BY IMAGE (Thai)
app.get('/search/image', async (req, res) => {
  try {
    const imgcode = req.query.imgcode || 'http://g-search3.alicdn.com/img/bao/uploaded/i4/01CN01DpcD8IzHpbsH1gYJtJf2200811456689.jpg';
    const url = `https://api.openchinaapi.com/v1/taobao/search_img_vip?lang=th&imgcode=${encodeURIComponent(imgcode)}&page=1&page_size=20`;

    const response = await axios.get(url, { headers });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PRODUCT DETAIL BY ID (Thai)
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

// 4. DECODE & DETAIL FROM FULL URL (Taobao / 1688)
app.get('/decode/full', async (req, res) => {
  try {
    const link = req.query.url || '';
    const match = link.match(/id=(\d{6,})|offer\/(\d{6,})/);
    const itemId = match ? (match[1] || match[2]) : null;
    if (!itemId) {
      return res.status(400).json({ success:false, message:'ไม่พบ item ID จากลิงก์นี้' });
    }

    const is1688   = link.includes('1688.com');
    const apiType  = is1688 ? '1688' : 'taobao';
    const detailUrl = `https://api.openchinaapi.com/v1/${apiType}/products/${itemId}?lang=th`;

    const detailRes = await axios.get(detailUrl, { headers });
    const raw = detailRes.data.data;
    if (!raw) {
      return res.status(404).json({ success:false, message:'ไม่พบข้อมูลสินค้า' });
    }

    // เตรียมข้อมูลเฉพาะที่จำเป็น
    const title = raw.title;
    const price = raw.min_price || raw.price || raw.original_price || '-';
    let picUrl = raw.pic_url || raw.image || '';
    if (picUrl.startsWith('//')) picUrl = 'https:' + picUrl;

    // เตรียม 3 thumbnail
    const thumbs = (raw.item_imgs || []).slice(0,3).map(i=>{
      let u = i.url;
      if (u.startsWith('//')) u = 'https:' + u;
      return u;
    });

    res.json({
      success: true,
      code:    detailRes.data.code,
      data:    { title, price, pic_url: picUrl, thumbs }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// 5. DECODE SHORT LINK - Taobao
app.get('/decode/taobao', async (req, res) => {
  try {
    const link = req.query.url || '';
    const url  = `https://api.openchinaapi.com/v1/taobao/item_urlencode?word=${encodeURIComponent(link)}&title=no`;

    const decodeRes = await axios.get(url, { headers });
    const itemId    = decodeRes.data?.data?.num_iid;
    if (!itemId) {
      return res.status(404).json({ success:false, message:'ไม่สามารถแปลงลิงก์ Taobao ได้' });
    }

    const detailUrl = `https://api.openchinaapi.com/v1/taobao/products/${itemId}?lang=th`;
    const detailRes = await axios.get(detailUrl, { headers });

    res.json(detailRes.data);
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
});

// 6. DECODE SHORT LINK - 1688
app.get('/decode/1688', async (req, res) => {
  try {
    const link = req.query.url || '';
    const url  = `https://api.openchinaapi.com/v1/1688/item_urlencode?word=${encodeURIComponent(link)}&title=no`;

    const decodeRes = await axios.get(url, { headers });
    const itemId    = decodeRes.data?.data?.num_iid;
    if (!itemId) {
      return res.status(404).json({ success:false, message:'ไม่สามารถแปลงลิงก์ 1688 ได้' });
    }

    const detailUrl = `https://api.openchinaapi.com/v1/1688/products/${itemId}?lang=th`;
    const detailRes = await axios.get(detailUrl, { headers });

    res.json(detailRes.data);
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
