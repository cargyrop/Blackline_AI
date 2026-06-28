const rateLimitBuckets = new Map();

function rateLimiter(windowMs, max) {
  windowMs = windowMs || 60000;
  max = max || 100;
  return function rateLimitMW(req, res, next) {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    if (!rateLimitBuckets.has(key)) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    const bucket = rateLimitBuckets.get(key);
    if (now > bucket.resetAt) {
      bucket.count = 1;
      bucket.resetAt = now + windowMs;
      return next();
    }
    bucket.count++;
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, b] of rateLimitBuckets) {
    if (now > b.resetAt + 60000) rateLimitBuckets.delete(k);
  }
}, 5 * 60 * 1000).unref();

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.googleapis.com https://*.anthropic.com https://*.openai.com https://*.groq.com https://*.openrouter.ai https://*.deepseek.com http://localhost:11434 http://127.0.0.1:11434; img-src 'self' data:;");
  next();
}

module.exports = {
  rateLimiter,
  securityHeaders,
};
