interface AnalyticsEvent {
  type:
    | "api_success"
    | "api_failed_with_fallback"
    | "cache_hit"
    | "rate_limit_hit";
  platform: string;
  timestamp: number;
  responseTimeMs?: number;
  source?: "api" | "cache" | "fallback";
  errorMessage?: string;
}

const events: AnalyticsEvent[] = [];

export function logAnalytics(event: Omit<AnalyticsEvent, "timestamp">) {
  events.push({
    ...event,
    timestamp: Date.now(),
  });

  // Garder seulement les 10000 derniers événements en mémoire
  if (events.length > 10000) {
    events.shift();
  }
}

/**
 * Retourne des stats pour un dashboard de monitoring
 */
export function getAnalyticsSnapshot() {
  const now = Date.now();
  const last24h = events.filter((e) => now - e.timestamp < 24 * 60 * 60 * 1000);

  const stats = {
    totalRequests: last24h.length,
    successRate:
      ((last24h.filter((e) => e.type === "api_success").length /
        (last24h.length || 1)) *
        100) |
      0,
    fallbackRate:
      ((last24h.filter((e) => e.type === "api_failed_with_fallback").length /
        (last24h.length || 1)) *
        100) |
      0,
    cacheHitRate:
      ((last24h.filter((e) => e.type === "cache_hit").length /
        (last24h.length || 1)) *
        100) |
      0,
    avgResponseTimeMs:
      (last24h
        .filter((e) => e.responseTimeMs)
        .reduce((sum, e) => sum + (e.responseTimeMs || 0), 0) /
        (last24h.filter((e) => e.responseTimeMs).length || 1)) |
      0,
    byPlatform: {} as Record<
      string,
      {
        count: number;
        successRate: number;
        avgResponseTimeMs: number;
      }
    >,
  };

  // Stats par plateforme
  const byPlatform = new Map<string, AnalyticsEvent[]>();
  last24h.forEach((e) => {
    if (!byPlatform.has(e.platform)) {
      byPlatform.set(e.platform, []);
    }
    byPlatform.get(e.platform)!.push(e);
  });

  byPlatform.forEach((platformEvents, platform) => {
    const successful = platformEvents.filter(
      (e) => e.type === "api_success"
    ).length;
    const withResponseTime = platformEvents.filter((e) => e.responseTimeMs);

    stats.byPlatform[platform] = {
      count: platformEvents.length,
      successRate: ((successful / (platformEvents.length || 1)) * 100) | 0,
      avgResponseTimeMs:
        (withResponseTime.reduce((sum, e) => sum + (e.responseTimeMs || 0), 0) /
          (withResponseTime.length || 1)) |
        0,
    };
  });

  return stats;
}

export type { AnalyticsEvent };
