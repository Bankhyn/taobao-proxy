// index_th.js - API Calls for OpenChinaAPI with Thai Language + Short Link Decoder

const axios = require('axios');

const API_TOKEN = 'ec3bdc1e65e7a2cb9a8248dd0e0c17fe7fd660d0';
const headers = { Authorization: `Token ${API_TOKEN}` };

// 1. SEARCH BY KEYWORD (Thai)
async function searchByKeywordTH() {
  const url = 'https://api.openchinaapi.com/v1/taobao/products?q=กระเป๋า&page=1&page_size=20&lang=th';
  const res = await axios.get(url, { headers });
  console.log('🔍 Search Keyword (TH):', res.data);
}

// 2. SEARCH BY IMAGE (Thai)
async function searchByImageTH() {
  const imgcode = 'http://g-search3.alicdn.com/img/bao/uploaded/i4/01CN01DpcD8IzHpbsH1gYJtJf2200811456689.jpg';
  const url = `https://api.openchinaapi.com/v1/taobao/search_img_vip?imgcode=${encodeURIComponent(imgcode)}&page=1&lang=th&page_size=20`;
  const res = await axios.get(url, { headers });
  console.log('🖼️ Search by Image (TH):', res.data);
}

// 3. PRODUCT DETAIL (Thai)
async function getProductDetailTH(itemId) {
  const url = `https://api.openchinaapi.com/v1/taobao/products/${itemId}?lang=th`;
  const res = await axios.get(url, { headers });
  console.log('📦 Product Detail (TH):', res.data);
}

// 4. ENCODE SHORT URL (TAOBAO)
async function decodeTaobaoShortLink(link) {
  const url = `https://api.openchinaapi.com/v1/taobao/item_urlencode?word=${encodeURIComponent(link)}&title=no`;
  const res = await axios.get(url, { headers });
  const itemId = res.data?.data?.num_iid;
  if (itemId) {
    await getProductDetailTH(itemId);
  } else {
    console.log('❌ Failed to decode Taobao link:', link);
  }
}

// 5. ENCODE SHORT URL (1688)
async function decode1688ShortLink(link) {
  const url = `https://api.openchinaapi.com/v1/1688/item_urlencode?word=${encodeURIComponent(link)}&title=no`;
  const res = await axios.get(url, { headers });
  const itemId = res.data?.data?.num_iid;
  if (itemId) {
    const detailUrl = `https://api.openchinaapi.com/v1/1688/products/${itemId}?lang=th`;
    const detailRes = await axios.get(detailUrl, { headers });
    console.log('📦 1688 Product Detail (TH):', detailRes.data);
  } else {
    console.log('❌ Failed to decode 1688 link:', link);
  }
}

// 🔁 TEST ALL THAI-COMPATIBLE ENDPOINTS
(async () => {
  await searchByKeywordTH();
  await searchByImageTH();
  await getProductDetailTH('605870333484'); // Replace with actual item ID
  await decodeTaobaoShortLink('https://m.tb.cn/h.5kK1bcJ9');
  await decode1688ShortLink('https://a.1688.com/p/8fijK9p4.html');
})();
