import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limit configurations
const RATE_LIMITS = {
  // Auth endpoints - 5 requests per 15 minutes (prevent brute force)
  auth: {
    requests: 5,
    window: '15 m',
    windowMs: 15 * 60 * 1000,
  },
  // Question generation - 20 per 15 minutes (CPU intensive)
  questionGeneration: {
    requests: 20,
    window: '15 m',
    windowMs: 15 * 60 * 1000,
  },
  // Public endpoints - 20 per minute
  public: {
    requests: 20,
    window: '1 m',
    windowMs: 60 * 1000,
  },
} as const;

// In-memory rate limiting fallback (when Redis is not configured)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: RateLimitStore = {};

// Clean up expired entries every minute
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    Object.keys(memoryStore).forEach((key) => {
      if (memoryStore[key].resetTime < now) {
        delete memoryStore[key];
      }
    });
  }, 60000);

  cleanupTimer.unref?.();
}

function memoryRateLimit(
  identifier: string,
  type: RateLimitType
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  if (!memoryStore[key]) {
    memoryStore[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset: memoryStore[key].resetTime,
    };
  }

  if (memoryStore[key].resetTime < now) {
    memoryStore[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset: memoryStore[key].resetTime,
    };
  }

  memoryStore[key].count++;
  const remaining = Math.max(0, config.requests - memoryStore[key].count);
  const success = memoryStore[key].count <= config.requests;

  return {
    success,
    limit: config.requests,
    remaining,
    reset: memoryStore[key].resetTime,
  };
}

// Initialize Redis client (only if credentials are provided)
let redis: Redis | null = null;
let rateLimiters: Record<string, Ratelimit> | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  rateLimiters = {
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.auth.requests, RATE_LIMITS.auth.window),
      analytics: true,
      prefix: 'ratelimit:auth',
    }),
    questionGeneration: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.questionGeneration.requests,
        RATE_LIMITS.questionGeneration.window
      ),
      analytics: true,
      prefix: 'ratelimit:questions',
    }),
    public: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.public.requests, RATE_LIMITS.public.window),
      analytics: true,
      prefix: 'ratelimit:public',
    }),
  };
}

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Rate limit a request by IP address
 * Returns { success: boolean, limit, remaining, reset }
 *
 * Uses Redis if configured, otherwise falls back to in-memory rate limiting
 */
export async function rateLimit(
  identifier: string,
  type: RateLimitType = 'public'
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If Redis is configured, use it
  if (rateLimiters && rateLimiters[type]) {
    const result = await rateLimiters[type].limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Otherwise, use in-memory rate limiting
  return memoryRateLimit(identifier, type);
}

/**
 * Get IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback for development
  return '127.0.0.1';
}
