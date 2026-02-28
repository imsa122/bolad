import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
  limit?: number;
};

// ============================================
// RATE LIMITER FACTORY
// ============================================
export function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60_000,
  });

  const limit = options?.limit || 10;

  return {
    check: (req: NextRequest, maxRequests?: number): { success: boolean; remaining: number; reset: number } => {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        '127.0.0.1';

      const tokenKey = `rate_limit_${ip}`;
      const now = Date.now();
      const windowMs = options?.interval || 60_000;
      const maxReqs = maxRequests || limit;

      const timestamps = tokenCache.get(tokenKey) || [];
      const windowStart = now - windowMs;

      // Filter out old timestamps
      const recentTimestamps = timestamps.filter((ts) => ts > windowStart);

      if (recentTimestamps.length >= maxReqs) {
        const oldestTimestamp = recentTimestamps[0];
        const reset = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
        return {
          success: false,
          remaining: 0,
          reset,
        };
      }

      recentTimestamps.push(now);
      tokenCache.set(tokenKey, recentTimestamps);

      return {
        success: true,
        remaining: maxReqs - recentTimestamps.length,
        reset: Math.ceil(windowMs / 1000),
      };
    },
  };
}

// ============================================
// PRE-CONFIGURED LIMITERS
// ============================================

// Strict limiter for auth routes
// DEV: 50 requests per minute | PROD: 5 requests per 15 minutes
export const authLimiter = rateLimit({
  interval: process.env.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'development' ? 50 : 5,
  uniqueTokenPerInterval: 500,
});

// Standard API limiter (100 requests per minute)
export const apiLimiter = rateLimit({
  interval: 60 * 1000,
  limit: 100,
  uniqueTokenPerInterval: 1000,
});

// Upload limiter (10 uploads per hour)
export const uploadLimiter = rateLimit({
  interval: 60 * 60 * 1000,
  limit: 10,
  uniqueTokenPerInterval: 200,
});

// ============================================
// RATE LIMIT RESPONSE HELPER
// ============================================
export function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(reset),
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(reset),
      },
    }
  );
}
