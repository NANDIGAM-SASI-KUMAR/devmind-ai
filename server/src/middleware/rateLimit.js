// Minimal in-memory, per-IP rate limiter for public (unauthenticated) endpoints that call
// paid APIs. Not distributed — resets per process — which is an acceptable tradeoff for a
// single-instance deployment; it exists purely to stop casual abuse, not to be bulletproof.
const buckets = new Map();

export const rateLimit = ({ windowMs, max }) => (req, res, next) => {
  const key = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return next();
  }

  if (bucket.count >= max) {
    const retryInMinutes = Math.ceil((windowMs - (now - bucket.windowStart)) / 60000);
    return res.status(429).json({ message: `Too many requests. Try again in about ${retryInMinutes} minute${retryInMinutes === 1 ? '' : 's'}.` });
  }

  bucket.count += 1;
  next();
};
