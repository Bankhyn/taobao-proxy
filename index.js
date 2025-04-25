// index.js
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 3000;

// ใส่ Token ของคุณ
const API_TOKEN = 'ec3bdc1e65e7a2cb9a8248dd0e0c17fe7fd660d0';
const HEADERS   = { Authorization: `Token ${API_TOKEN}` };

app.use(cors());
app.get('/', (_req, res) => res.send('🟢 Taobao Proxy API'));


// ปลดลิงก์สั้นแล้วดึง detail ให้อัตโนมัติ (1688 หรือ Taobao)
app.get('/decode/full', async (req, res) => {
  try {
    const link = req.query.url || '';
    // หา itemId จาก offer/ หรือ id=
    const m = link.match(/offer\/(\d+)|id=(\d+)/);
    const itemId = m ? (m[1]||m[2]) : null;
    if (!itemId) return res.status(400).json({ error: 'ไม่พบ Item ID' });

    // เลือกระหว่าง 1688 vs taobao
    const apiType = link.includes('1688.com') ? '1688' : 'taobao';
    const url     = `https://api.openchinaapi.com/v1/${apiType}/products/${itemId}?lang=th`;
    const r       = await axios.get(url, { headers: HEADERS });
    return res.json(r.data);
  }
  catch(err) { return res.status(500).json({ error: err.message }); }
});

// กรณี short link แบบเฉพาะ (Taobao หรือ 1688) – ใช้ decode word → detail
app.get('/decode/taobao', async (req, res) => {
  try {
    const link = req.query.url || '';
    const dec  = await axios.get(
      `https://api.openchinaapi.com/v1/taobao/item_urlencode?word=${encodeURIComponent(link)}&title=no`,
      { headers: HEADERS }
    );
    const id = dec.data?.data?.num_iid;
    if (!id) return res.status(404).json({ error: 'Taobao short link แปลงไม่ได้' });
    const out = await axios.get(`https://api.openchinaapi.com/v1/taobao/products/${id}?lang=th`, { headers: HEADERS });
    return res.json(out.data);
  }
  catch(err) { return res.status(500).json({ error: err.message }); }
});

app.get('/decode/1688', async (req, res) => {
  try {
    const link = req.query.url || '';
    const dec  = await axios.get(
      `https://api.openchinaapi.com/v1/1688/item_urlencode?word=${encodeURIComponent(link)}&title=no`,
      { headers: HEADERS }
    );
    const id = dec.data?.data?.num_iid;
    if (!id) return res.status(404).json({ error: '1688 short link แปลงไม่ได้' });
    const out = await axios.get(`https://api.openchinaapi.com/v1/1688/products/${id}?lang=th`, { headers: HEADERS });
    return res.json(out.data);
  }
  catch(err) { return res.status(500).json({ error: err.message }); }
});

// ค้นด้วย Keyword (Taobao only)
app.get('/search/keyword', async (req, res) => {
  try {
    const { q='กระเป๋า', page=1, page_size=20 } = req.query;
    const url = `https://api.openchinaapi.com/v1/taobao/products`
              + `?q=${encodeURIComponent(q)}&page=${page}&page_size=${page_size}&lang=th`;
    const r   = await axios.get(url, { headers: HEADERS });
    return res.json(r.data);
  }
  catch(err) { return res.status(500).json({ error: err.message }); }
});


app.listen(PORT, () => console.log(`✅ Running on http://localhost:${PORT}`));
