import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limit configurations
const RATE_LIMITS = {
  // Auth endpoints - 5 requests per 15 minutes (prevent brute force)
  auth: {
    requests: 5,
    window: '15 m',
  },
  // Question generation - 20 per 15 minutes (CPU intensive)
  questionGeneration: {
    requests: 20,
    window: '15 m',
  },
  // Public endpoints - 20 per minute
  public: {
    requests: 20,
    window: '1 m',
  },
} as const;

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
 * Gracefully degrades: if Redis is not configured, allows all requests
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
  // If rate limiting is not configured (dev mode), allow all requests
  if (!rateLimiters || !rateLimiters[type]) {
    return {
      success: true,
      limit: RATE_LIMITS[type].requests,
      remaining: RATE_LIMITS[type].requests,
      reset: Date.now() + 60000,
    };
  }

  const result = await rateLimiters[type].limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
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
