const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Đang chuyển hướng...</title>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-4J7LFH0XTC"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-4J7LFH0XTC', {
            page_path: window.location.pathname + window.location.search
          });

          gtag('event', 'redirect_to_shopee', {
            event_category: 'engagement',
            event_label: window.location.href
          });

          setTimeout(function () {
            window.location.href = "https://s.shopee.vn/3LEXW9cvAH";
          }, 1500);
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
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
