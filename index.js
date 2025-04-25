// index.js
// ───────────────────────────────────────────────────────────────────────────────
// • npm install express axios cors
// • ตั้ง API_TOKEN เป็น environment variable
// • Start: node index.js

const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN; 
const HEADERS = { Authorization: `Token ${API_TOKEN}` };

// เปิด CORS ให้ทุกโดเมน
app.use(cors());
app.use(express.json());

// สุขภาพเซอร์วิส
app.get('/', (_req, res) => {
  res.send('🐙 Taobao-Proxy is up');
});

// ฟังก์ชันช่วยเลือกเฉพาะฟิลด์ที่ต้องการ
function pick(obj, fields) {
  return fields.reduce((o,k) => {
    if (obj[k] !== undefined) o[k] = obj[k];
    return o;
  }, {});
}

// ─── 1. SEARCH BY KEYWORD ─────────────────────────────────────────────────────
app.get('/search/keyword', async (req, res) => {
  try {
    const {
      q = 'กระเป๋า',
      page = 1,
      page_size = 10,
      lang = 'th',
      sort = 'desc'
    } = req.query;

    const url = `https://api.openchinaapi.com/v1/taobao/products` +
                `?q=${encodeURIComponent(q)}` +
                `&page=${page}&page_size=${page_size}` +
                `&lang=${lang}&sort=${sort}`;

    const apiRes = await axios.get(url, { headers: HEADERS });
    // data.data คืออาร์เรย์ของสินค้า
    const simple = apiRes.data.data.map(item =>
      pick(item, ['num_iid','title','price','detail_url','pic_url'])
    );
    res.json({ success: true, data: simple });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// ─── 2. DECODE FULL URL ────────────────────────────────────────────────────────
//    (1688 หรือ taobao link ตรงๆ เช่น detail.1688.com หรือ item.taobao.com/…)
app.get('/decode/full', async (req, res) => {
  try {
    const rawUrl = req.query.url;
    // ดึง itemId จาก id=xxxx หรือ offer/xxxx
    const match = rawUrl.match(/id=(\d+)|offer\/(\d+)/);
    const itemId = match ? (match[1]||match[2]) : null;

    if (!itemId) {
      return res.status(400).json({ success:false, error:'No item ID found' });
    }

    // เลือก 1688 หรือ taobao
    const is1688 = rawUrl.includes('1688.com');
    const apiType = is1688 ? '1688' : 'taobao';
    const url = `https://api.openchinaapi.com/v1/${apiType}/products/${itemId}?lang=th`;

    const detailRes = await axios.get(url, { headers: HEADERS });
    const data = detailRes.data.data;
    // คืนเฉพาะฟิลด์สำคัญ
    res.json({
      success: true,
      data: pick(data, ['num_iid','title','price','detail_url','pic_url','desc'])
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// ─── 3. DECODE SHORT LINK (Taobao) ────────────────────────────────────────────
app.get('/decode/taobao', async (req, res) => {
  try {
    const shortLink = req.query.url;
    const url = `https://api.openchinaapi.com/v1/taobao/item_urlencode?word=${encodeURIComponent(shortLink)}&title=no`;
    const decodeRes = await axios.get(url, { headers: HEADERS });
    const itemId = decodeRes.data.data?.num_iid;
    if (!itemId) {
      return res.status(404).json({ success:false, error:'Cannot decode taobao short link' });
    }
    // แล้ว fetch /products เหมือน full
    const detailUrl = `https://api.openchinaapi.com/v1/taobao/products/${itemId}?lang=th`;
    const detailRes = await axios.get(detailUrl, { headers: HEADERS });
    const data = detailRes.data.data;
    res.json({
      success: true,
      data: pick(data, ['num_iid','title','price','detail_url','pic_url','desc'])
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// ─── 4. DECODE SHORT LINK (1688) ─────────────────────────────────────────────
app.get('/decode/1688', async (req, res) => {
  try {
    const shortLink = req.query.url;
    const url = `https://api.openchinaapi.com/v1/1688/item_urlencode?word=${encodeURIComponent(shortLink)}&title=no`;
    const decodeRes = await axios.get(url, { headers: HEADERS });
    const itemId = decodeRes.data.data?.num_iid;
    if (!itemId) {
      return res.status(404).json({ success:false, error:'Cannot decode 1688 short link' });
    }
    const detailUrl = `https://api.openchinaapi.com/v1/1688/products/${itemId}?lang=th`;
    const detailRes = await axios.get(detailUrl, { headers: HEADERS });
    const data = detailRes.data.data;
    res.json({
      success: true,
      data: pick(data, ['num_iid','title','price','detail_url','pic_url','desc'])
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// Start
app.listen(PORT, () => console.log(`✅ Listening on :${PORT}`));
