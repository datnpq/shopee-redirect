// index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Redirect route
app.get('/', (req, res) => {
  // Optional: log user-agent, IP, query,...
  console.log(`[${new Date().toISOString()}] Redirected: ${req.ip} → ${req.headers['user-agent']}`);
  
  res.redirect('https://s.shopee.vn/3LEXW9cvAH');
});

app.listen(PORT, () => {
  console.log(`Redirect server is running at http://localhost:${PORT}`);
});
