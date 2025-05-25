const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

// TELEGRAM CONFIG
const TELEGRAM_BOT_TOKEN = '7206799463:AAFU0vGm5NBkC1qWfwF24tlCRTn_O6yxO3o';
const TELEGRAM_CHAT_ID = '5479175202';

// Gửi tin nhắn Telegram
function notifyTelegram(subid, zoneid, ip, ua) {
  const message = `📲 *Click Mới Về Shopee!*\n` +
                  `🆔 SubID: \`${subid}\`\n` +
                  `🌐 ZoneID: \`${zoneid}\`\n` +
                  `📍 IP: \`${ip}\`\n` +
                  `📱 Thiết bị: \`${ua}\``;

  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  }).catch(err => console.error('❌ Telegram error:', err));
}

// Route gốc – xử lý redirect + tracking
app.get('/', (req, res) => {
  const subid = req.query.subid || 'unknown';
  const zoneid = req.query.zoneid || 'unknown';
  const ip = req.ip;
  const ua = req.headers['user-agent'];

  // Gửi báo Telegram
  notifyTelegram(subid, zoneid, ip, ua);

  // Trả về HTML có GA4 và redirect
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

        // Fallback nếu callback không về
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

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
