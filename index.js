const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

// TELEGRAM CONFIG
const TELEGRAM_BOT_TOKEN = '7206799463:AAFU0vGm5NBkC1qWfwF24tlCRTn_O6yxO3o';
const TELEGRAM_CHAT_ID = '5479175202';

// Gửi tin nhắn Telegram
async function notifyTelegram(subid, zoneid, ip, ua) {
  const message = `📲 *Click Mới Về Shopee!*\n` +
                  `🆔 SubID: \`${subid}\`\n` +
                  `🌐 ZoneID: \`${zoneid}\`\n` +
                  `📍 IP: \`${ip}\`\n` +
                  `📱 Thiết bị: \`${ua}\``;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const data = await res.json();
    if (!data.ok) console.error('❌ Telegram API error:', data);
  } catch (err) {
    console.error('❌ Telegram network error:', err);
  }
}

// Route redirect
app.get('/', async (req, res) => {
  const subid = req.query.subid || 'unknown';
  const zoneid = req.query.zoneid || 'unknown';
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const ua = req.headers['user-agent'] || 'unknown';

  // Gửi Telegram nếu có subid hợp lệ (chặn crawler spam)
  if (subid !== 'unknown' && subid.length > 1) {
    console.log(`📥 New click: ${subid} | zone: ${zoneid} | ip: ${ip}`);
    await notifyTelegram(subid, zoneid, ip, ua);
  } else {
    console.log(`🤖 Bỏ qua click không hợp lệ từ IP ${ip}`);
  }

  // HTML trả về
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Shopee redirect bot chạy tại http://localhost:${PORT}`);
});
