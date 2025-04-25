// index.js
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
const app     = express();
const port    = process.env.PORT || 3000;

// ใส่ API_TOKEN ของคุณตรงนี้
const API_TOKEN = 'ec3bdc1e65e7a2cb9a8248dd0e0c17fe7fd660d0';
const headers   = { Authorization: `Token ${API_TOKEN}` };

app.use(cors());  // เปิด CORS ให้ Wix ดึงได้

// Health-check
app.get('/', (req, res) => res.send('🟢 Taobao Proxy API is running...'));

// Decode + Detail + Resize ภาพ
app.get('/decode/full', async (req, res) => {
  try {
    const link = req.query.url;
    // หา item ID จาก url.taobao.com หรือ detail.1688.com/offer/...
    const match = link.match(/id=(\d{6,})|offer\/(\d{6,})/);
    const itemId = match ? (match[1]||match[2]) : null;
    if (!itemId) {
      return res.status(400).json({ success:false, message:'ไม่พบ item ID' });
    }

    // เลือกใช้ API taobao หรือ 1688
    const is1688  = link.includes('1688.com');
    const apiType = is1688 ? '1688' : 'taobao';
    const detailUrl = `https://api.openchinaapi.com/v1/${apiType}/products/${itemId}?lang=th`;

    // ขอข้อมูล detail มาดื้อ ๆ
    const detailRes = await axios.get(detailUrl, { headers });
    const raw = detailRes.data?.data;
    if (!raw) return res.status(404).json({ success:false, message:'ไม่พบข้อมูลสินค้า' });

    // ดึงชื่อ ราคา
    const title = raw.title;
    const price = raw.min_price || raw.price || raw.original_price || '-';

    // เตรียมรูปหลัก (600×600)
    let picUrl = raw.pic_url || raw.image || '';
    if (picUrl.startsWith('//')) picUrl = 'https:' + picUrl;
    // ถอดพารามิเตอร์เก่าออก แล้วเติม _600x600.jpg ต่อท้าย
    picUrl = picUrl.split('.jpg')[0] + '_600x600.jpg';

    // เตรียม thumbnail 3 รูป (300×300)
    const thumbs = (raw.item_imgs||[]).slice(0,3).map(i=>{
      let u = i.url;
      if (u.startsWith('//')) u = 'https:' + u;
      return u.split('.jpg')[0] + '_300x300.jpg';
    });

    // ส่งกลับเฉพาะฟิลด์ที่จำเป็น
    res.json({
      success: true,
      code: detailRes.data.code,
      data: { title, price, pic_url: picUrl, thumbs }
    });
  }
  catch(err) {
    console.error(err);
    res.status(500).json({ success:false, message: err.message });
  }
});

app.listen(port, ()=>console.log(`✅ Server running on port ${port}`));
