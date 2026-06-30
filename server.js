const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const { securityHeaders, rateLimiter } = require('./backend/middleware/security');
const mountRoutes = require('./backend/routes');

const app = express();
app.disable('x-powered-by');
const PORT = parseInt(process.env.PORT, 10) || 3737;
app.locals.assetVersion = process.env.BLACKLINE_ASSET_VERSION || `dev-${Date.now().toString(36)}`;

app.use(cors({
  origin(origin, cb) {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) return cb(null, true);
    cb(new Error('Origin not allowed'));
  },
}));
app.use(securityHeaders);

// Static assets served BEFORE rate limiter — local-first desktop app,
// static file requests must never be throttled. A single page refresh
// generates ~30 requests (CSS, JS, vendor, manifest). Rate limiting
// only applies to API routes (mounted after this).
app.use(express.static(path.join(__dirname, 'frontend'), {
  index: false,
  etag: false,
  lastModified: false,
  maxAge: 0,
}));

// Rate limiter applies only to API routes (mounted below), not static assets
const apiRateLimiter = rateLimiter(60000, 200);
app.use('/api', apiRateLimiter);

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  // ARKEL is self-evolving during local development; stale cached JS/CSS
  // can make a freshly updated app look like the old version. Disable browser
  // caching for all local app assets and API responses.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

mountRoutes(app);

app.listen(PORT, () => {
  console.log(`\n[OK]  ARKEL running at http://localhost:${PORT}\n`);
  if (!process.env.NO_OPEN_BROWSER) {
    const url = `http://localhost:${PORT}`;
    const cmd = process.platform === 'win32' ? `start ${url}` :
                 process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(cmd, () => {});
  }
});
