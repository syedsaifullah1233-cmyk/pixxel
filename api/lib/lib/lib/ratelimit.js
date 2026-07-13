/**
 * lib/rateLimit.js
 * ------------------------------------------------------------------
 * Lightweight, dependency-free in-memory rate limiter.
 *
 * IMPORTANT LIMITATION:
 * Vercel Serverless Functions are stateless and may run on a fresh
 * container for every invocation (especially after periods of
 * inactivity, or when scaled across multiple concurrent instances).
 * This means the in-memory store below is a "best effort" mitigation
 * against basic spam/abuse — not a hard guarantee — because it only
 * persists for the lifetime of a single warm function instance.
 *
 * For strict, globally-consistent rate limiting in production, pair
 * this with an external store such as Upstash Redis (has a native
 * Vercel integration) or Vercel KV. The interface below is designed
 * so it can be swapped for a Redis-backed version without touching
 * calling code.
 * ------------------------------------------------------------------
 */

// Map<ip, { count: number, windowStart: number }>
const requestLog = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minute window
const MAX_REQUESTS_PER_WINDOW = 5; // max submissions per IP per window

/**
 * Periodically clear stale entries so the Map doesn't grow forever
 * within a long-lived warm instance.
 */
function pruneStaleEntries(now) {
  for (const [ip, entry] of requestLog.entries()) {
    if (now - entry.windowStart > WINDOW_MS) {
      requestLog.delete(ip);
    }
  }
}

/**
 * Checks whether the given identifier (typically client IP) is
 * currently within its allowed rate limit. Records the attempt.
 * @param {string} identifier
 * @returns {{ allowed: boolean, retryAfterSeconds: number }}
 */
function checkRateLimit(identifier) {
  const now = Date.now();
  pruneStaleEntries(now);

  const key = identifier || 'unknown';
  const existing = requestLog.get(key);

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    requestLog.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((existing.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Extracts the best-guess client IP from a Vercel serverless request.
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

module.exports = { checkRateLimit, getClientIp };
