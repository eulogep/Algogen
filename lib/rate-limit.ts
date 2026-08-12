import { NextRequest, NextResponse } from "next/server";
import { logAnalytics } from "./analytics";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiter en mémoire
 * En production : utiliser Redis ou une service comme Upstash
 */
export function checkRateLimit(
  identifier: string, // IP ou user_id
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute par défaut
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = limits.get(identifier);

  // Créer une nouvelle entrée si n'existe pas
  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    limits.set(identifier, newEntry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
  }

  // Vérifier la limite
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Middleware pour protéger les routes API
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>,
  options: { maxRequests?: number; windowMs?: number } = {}
): Promise<Response> {
  const { maxRequests = 10, windowMs = 60 * 1000 } = options;

  // Utiliser IP ou user_id comme identifier
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limit = checkRateLimit(ip, maxRequests, windowMs);

  if (!limit.allowed) {
    // Attempt to extract platform from request for analytics
    let platform = "unknown";
    try {
      const cloned = request.clone();
      const body = await cloned.json();
      if (body.platform) platform = body.platform;
    } catch {}

    logAnalytics({
      type: "rate_limit_hit",
      platform,
    });

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(limit.resetAt),
        },
      }
    );
  }

  const response = await handler(request);

  // Ajouter headers rate limit à la réponse
  response.headers.set("X-RateLimit-Limit", String(maxRequests));
  response.headers.set("X-RateLimit-Remaining", String(limit.remaining));
  response.headers.set("X-RateLimit-Reset", String(limit.resetAt));

  return response;
}
