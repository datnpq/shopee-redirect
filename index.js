const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

// TELEGRAM CONFIG
const TELEGRAM_BOT_TOKEN = '7206799463:AAFU0vGm5NBkC1qWfwF24tlCRTn_O6yxO3o';
const TELEGRAM_CHAT_ID = '5479175202';
const CLICK_LOG_PATH = path.join(__dirname, 'clicks.json');

// Gửi tin nhắn Telegram
async function notifyTelegram(subid, zoneid, ip, ua) {
  const message = `📲 *Click Mới Về Shopee!*\n` +
                  `🆔 SubID: \`${subid}\`\n` +
                  `🌐 ZoneID: \`${zoneid}\`\n` +
                  `📍 IP: \`${ip}\`\n` +
                  `📱 Thiết bị: \`${ua}\``;

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
function logClick({ subid, zoneid, ip, ua }) {
  const click = {
    time: new Date().toISOString(),
    subid,
    zoneid,
    ip,
    ua
  };

  let log = [];
  if (fs.existsSync(CLICK_LOG_PATH)) {
    try {
  log = JSON.parse(fs.readFileSync(CLICK_LOG_PATH, 'utf-8'));
} catch (e) {
  log = [];
}
  }

  log.unshift(click); // mới nhất ở đầu
  fs.writeFileSync(CLICK_LOG_PATH, JSON.stringify(log.slice(0, 1000), null, 2)); // giữ tối đa 1000 dòng
}

// Route redirect chính
app.get('/', async (req, res) => {
  const subid = req.query.subid || 'unknown';
  const zoneid = req.query.zoneid || 'unknown';
  const ipRaw = req.headers['x-forwarded-for'] || req.ip;
  const ip = ipRaw.split(',')[0].trim();
  const ua = req.headers['user-agent'] || 'unknown';
  const isValid = ua.toLowerCase().includes('mozilla') || req.url.includes('redirect_to_shopee');

  if (isValid) {
    console.log(`📥 Click hợp lệ từ IP ${ip}`);
    logClick({ subid, zoneid, ip, ua });
    await notifyTelegram(subid, zoneid, ip, ua);
  } else {
    console.log(`🤖 Bỏ qua click không hợp lệ từ IP ${ip}`);
  }

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
              window.location.href = "https://s.shopee.vn/3LEXW9cvAH";
            }, 300);
          }
        });

        setTimeout(() => {
          window.location.href = "https://s.shopee.vn/3LEXW9cvAH";
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

app.get('/dashboard', (req, res) => {
  const auth = req.query.key;
  if (auth !== 'D@t12345') return res.status(403).send('🚫 Không có quyền truy cập');
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Shopee redirect bot running at http://localhost:${PORT}`);
});
