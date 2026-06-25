const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const { securityHeaders, rateLimiter } = require('./backend/middleware/security');
const mountRoutes = require('./backend/routes');

const app = express();
app.disable('x-powered-by');
const PORT = parseInt(process.env.PORT, 10) || 3737;

app.use(cors({
  origin(origin, cb) {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) return cb(null, true);
    cb(new Error('Origin not allowed'));
  },
}));
app.use(securityHeaders);
app.use(rateLimiter(60000, 90));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'frontend'), {
  etag: true,
  lastModified: true,
  maxAge: '1h',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

mountRoutes(app);

app.listen(PORT, () => {
  console.log(`\n[OK]  BLACKLINE AI running at http://localhost:${PORT}\n`);
  if (!process.env.NO_OPEN_BROWSER) {
    const url = `http://localhost:${PORT}`;
    const cmd = process.platform === 'win32' ? `start ${url}` :
                 process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(cmd, () => {});
  }
});
