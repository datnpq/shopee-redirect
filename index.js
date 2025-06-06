const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

// TELEGRAM CONFIG
const TELEGRAM_BOT_TOKEN = '7206799463:AAFU0vGm5NBkC1qWfwF24tlCRTn_O6yxO3o';
const TELEGRAM_CHAT_ID = '5479175202';
const CLICK_LOG_PATH = path.join(__dirname, 'clicks.json');

// Gửi tin nhắn Telegram
async function notifyTelegram(data) {
  const message = `📲 *Click Mới Về Shopee!*
🆔 *SubID:* \`${data.subid}\`
🌐 *ZoneID:* \`${data.zoneid}\`
📍 *IP:* \`${data.ip}\`
🗺 *Quốc gia:* \`${data.country}\`
🏙 *Thành phố:* \`${data.city}\`
🌐 *ISP:* \`${data.isp}\`
📱 *Thiết bị:* \`${data.ua}\`
🕹 *Trạng thái:* \`${data.status}\`
🕒 *Thời gian:* ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    console.error('❌ Telegram error:', err);
  }
}

// Lưu log click
function logClick(data) {
  const click = {
    time: new Date().toISOString(),
    ...data
  };

  let log = [];
  if (fs.existsSync(CLICK_LOG_PATH)) {
    try {
      log = JSON.parse(fs.readFileSync(CLICK_LOG_PATH, 'utf-8'));
    } catch (e) {
      console.error('❌ Lỗi đọc clicks.json, khởi tạo lại');
      log = [];
    }
  }

  log.unshift(click); // mới nhất lên đầu
  try {
    fs.writeFileSync(CLICK_LOG_PATH + '.bak', JSON.stringify(log.slice(0, 1000), null, 2));
    fs.writeFileSync(CLICK_LOG_PATH, JSON.stringify(log.slice(0, 1000), null, 2));
  } catch (err) {
    console.error('❌ Lỗi ghi file clicks.json:', err);
  }
}

// Route redirect chính
app.get('/', async (req, res) => {
  const subid = req.query.subid || 'unknown';
  const zoneid = req.query.zoneid || 'unknown';
  const device = req.query.device || 'unknown';
  const os = req.query.os || 'unknown';
  const ipRaw = req.headers['x-forwarded-for'] || req.ip;
  const ip = ipRaw.split(',')[0].trim();
  const ua = req.headers['user-agent'] || 'unknown';
  const isValid = ua.toLowerCase().includes('mozilla');
  const status = isValid ? 'valid' : 'invalid';

  let country = 'unknown';
  let city = 'unknown';
  let isp = 'unknown';

  try {
    const geo = await axios.get(`http://ip-api.com/json/${ip}`);
    country = geo.data.country || 'unknown';
    city = geo.data.city || 'unknown';
    isp = geo.data.isp || 'unknown';
  } catch (err) {
    console.error('❌ Không lấy được IP location:', err.message);
  }

  const clickData = { subid, zoneid, ip, ua, country, city, isp, device, os, status };
  console.log(`📥 Click từ IP ${ip} – ${country}/${city} – ISP: ${isp} – Status: ${status}`);
  logClick(clickData);
  await notifyTelegram(clickData);

  const html = `
  <!DOCTYPE html>
  <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <title>Đang chuyển hướng...</title>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-4J7LFH0XTC"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('js', new Date());

        gtag('config', 'G-4J7LFH0XTC', {
          page_path: window.location.pathname + window.location.search
        });

        gtag('event', 'redirect_to_shopee', {
          event_category: 'engagement',
          event_label: window.location.href,
          event_callback: function () {
            setTimeout(() => {
              window.location.href = "https://tinyurl.com/278f5qqo";
            }, 300);
          }
        });

        setTimeout(() => {
          window.location.href = "https://tinyurl.com/278f5qqo";
        }, 2500);
      </script>
    </head>
    <body>
      <p>Đang chuyển sang Shopee... Vui lòng chờ trong giây lát.</p>
    </body>
  </html>
  `;
  res.send(html);
});

// Route dashboard công khai
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Cho phép truy cập file clicks.json từ frontend
app.use(express.static(__dirname));

app.use(express.json({ limit: '2mb' }));

app.post('/save-clicks', (req, res) => {
  try {
    const updatedClicks = req.body;
    fs.writeFileSync(CLICK_LOG_PATH, JSON.stringify(updatedClicks, null, 2));
    res.status(200).send({ message: 'Đã lưu clicks.json thành công.' });
    console.log('✅ clicks.json đã được cập nhật từ dashboard.');
  } catch (err) {
    console.error('❌ Lỗi khi ghi clicks.json:', err);
    res.status(500).send({ error: 'Ghi file thất bại' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Shopee redirect bot running at http://localhost:${PORT}`);
});
