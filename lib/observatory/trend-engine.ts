import type {
  PersistedTrendObservation,
  SocialMetrics,
  SocialSignal,
  TrendEvidence,
  TrendMetrics,
  TrendObservation,
} from "./types";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_EVIDENCE_PER_TOPIC = 12;

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function finite(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeTopic(topic: string): string {
  return topic
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function engagementFromMetrics(metrics?: SocialMetrics): number {
  if (!metrics) return 0;
  if (typeof metrics.engagementRate === "number") {
    return clamp(metrics.engagementRate);
  }

  const interactions =
    finite(metrics.likes) + finite(metrics.comments) + finite(metrics.shares);
  const denominator = finite(metrics.views) || finite(metrics.followers);

  return denominator > 0 ? clamp((interactions / denominator) * 100) : 0;
}

function velocityFromSignal(signal: SocialSignal): number {
  const explicitVelocity = signal.metrics?.viewsPerHour;
  if (typeof explicitVelocity === "number" && explicitVelocity >= 0) {
    return explicitVelocity;
  }

  const publishedAt = Date.parse(signal.publishedAt);
  const detectedAt = Date.parse(signal.detectedAt);
  const ageHours = Math.max(1, (detectedAt - publishedAt) / HOUR_MS);
  return finite(signal.metrics?.views) / ageHours;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function recencyScore(signals: SocialSignal[], now: Date): number {
  if (signals.length === 0) return 0;
  const averageAgeHours =
    signals.reduce((total, signal) => {
      const detectedAt = Date.parse(signal.detectedAt);
      return total + Math.max(0, (now.getTime() - detectedAt) / HOUR_MS);
    }, 0) / signals.length;

  return clamp(100 * Math.exp(-averageAgeHours / 72));
}

function topicEvidence(signal: SocialSignal): TrendEvidence {
  return {
    id: signal.id,
    platform: signal.platform,
    sourceType: signal.sourceType,
    url: signal.url,
    title: signal.title,
    detectedAt: signal.detectedAt,
    metrics: signal.metrics,
  };
}

function calculateMetrics(signals: SocialSignal[], now: Date): TrendMetrics {
  const velocities = signals.map(velocityFromSignal);
  const velocity = median(velocities);
  const sortedVelocities = [...velocities].sort((a, b) => b - a);
  const upper = sortedVelocities.slice(0, Math.max(1, Math.ceil(sortedVelocities.length / 2)));
  const lower = sortedVelocities.slice(Math.floor(sortedVelocities.length / 2));
  const acceleration =
    median(lower) > 0 ? clamp(((median(upper) - median(lower)) / median(lower)) * 100) : 0;
  const engagement =
    signals.reduce((total, signal) => total + engagementFromMetrics(signal.metrics), 0) /
    signals.length;
  const novelty = recencyScore(signals, now);
  const crossPlatformSpread = new Set(signals.map((signal) => signal.platform)).size;

  return {
    velocity: Math.round(velocity * 100) / 100,
    acceleration: Math.round(acceleration * 100) / 100,
    engagement: Math.round(engagement * 100) / 100,
    novelty: Math.round(novelty * 100) / 100,
    crossPlatformSpread,
  };
}

/**
 * Score composite lisible et borné. Les termes sont volontairement séparés
 * pour pouvoir être calibrés à partir de données réelles ultérieurement.
 */
function calculateTrendScore(metrics: TrendMetrics): number {
  const normalizedVelocity = clamp(Math.log10(metrics.velocity + 1) * 20);
  const normalizedSpread = clamp(metrics.crossPlatformSpread * 20);

  return Math.round(
    clamp(
      normalizedVelocity * 0.3 +
        metrics.engagement * 0.22 +
        metrics.acceleration * 0.18 +
        metrics.novelty * 0.15 +
        normalizedSpread * 0.15
    )
  );
}

function calculateConfidence(signals: SocialSignal[]): number {
  const evidence = Math.min(signals.length, 6) / 6;
  const sourceDiversity = new Set(signals.map((signal) => signal.sourceType)).size;
  const platformDiversity = new Set(signals.map((signal) => signal.platform)).size;
  const authoritativeSources = signals.filter(
    (signal) => signal.sourceType === "official_newsroom"
  ).length;

  return Math.round(
    clamp(
      evidence * 45 +
        Math.min(sourceDiversity, 3) * 10 +
        Math.min(platformDiversity, 3) * 8 +
        Math.min(authoritativeSources, 2) * 5
    )
  );
}

export function detectTrendObservations(
  signals: SocialSignal[],
  now = new Date()
): TrendObservation[] {
  const grouped = new Map<string, SocialSignal[]>();

  for (const signal of signals) {
    const topicKey = normalizeTopic(signal.topic);
    if (!topicKey) continue;
    grouped.set(topicKey, [...(grouped.get(topicKey) ?? []), signal]);
  }

  return [...grouped.entries()]
    .map(([topicKey, topicSignals]) => {
      const metrics = calculateMetrics(topicSignals, now);
      const evidence = topicSignals
        .sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt))
        .slice(0, MAX_EVIDENCE_PER_TOPIC)
        .map(topicEvidence);

      return {
        topic: topicSignals[0].topic.trim(),
        topicKey,
        platforms: [...new Set(topicSignals.map((signal) => signal.platform))],
        sourceTypes: [...new Set(topicSignals.map((signal) => signal.sourceType))],
        metrics,
        trendScore: calculateTrendScore(metrics),
        confidence: calculateConfidence(topicSignals),
        evidenceCount: topicSignals.length,
        evidence,
        detectedAt: now.toISOString(),
      };
    })
    .sort((a, b) => b.trendScore - a.trendScore || b.confidence - a.confidence);
}

export function toPersistedObservation(
  observation: TrendObservation
): PersistedTrendObservation {
  return {
    topic: observation.topic,
    topic_key: observation.topicKey,
    platforms: observation.platforms,
    source_types: observation.sourceTypes,
    velocity: observation.metrics.velocity,
    acceleration: observation.metrics.acceleration,
    engagement: observation.metrics.engagement,
    novelty: observation.metrics.novelty,
    cross_platform_spread: observation.metrics.crossPlatformSpread,
    trend_score: observation.trendScore,
    confidence: observation.confidence,
    evidence_count: observation.evidenceCount,
    evidence: observation.evidence,
    detected_at: observation.detectedAt,
    detected_on: observation.detectedAt.slice(0, 10),
  };
}

export function getFreshSignals(signals: SocialSignal[], now = new Date()): SocialSignal[] {
  return signals.filter((signal) => {
    const detectedAt = Date.parse(signal.detectedAt);
    return Number.isFinite(detectedAt) && now.getTime() - detectedAt <= 7 * DAY_MS;
  });
}
