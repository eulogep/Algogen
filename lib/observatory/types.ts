export type SignalPlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "reddit"
  | "x_twitter"
  | "google"
  | "github"
  | "linkedin"
  | "web";

export type SignalSourceType =
  | "official_newsroom"
  | "creator_post"
  | "trend_feed"
  | "community_discussion"
  | "competitor_content"
  | "manual";

export interface SocialMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  followers?: number;
  engagementRate?: number;
  viewsPerHour?: number;
}

/**
 * Une observation normalisée venant d'une source autorisée. Les données brutes
 * restent volontairement limitées aux métriques nécessaires au calcul afin de
 * réduire le couplage avec les plateformes et leurs contrats d'API.
 */
export interface SocialSignal {
  id: string;
  platform: SignalPlatform;
  sourceType: SignalSourceType;
  topic: string;
  url: string;
  title?: string;
  publishedAt: string;
  detectedAt: string;
  metrics?: SocialMetrics;
  author?: {
    id: string;
    followers?: number;
  };
  evidence?: string;
}

export interface TrendProvider {
  readonly id: string;
  fetchSignals(context: TrendProviderContext): Promise<SocialSignal[]>;
}

export interface TrendProviderContext {
  now: Date;
  signal?: AbortSignal;
}

export interface TrendMetrics {
  velocity: number;
  acceleration: number;
  engagement: number;
  novelty: number;
  crossPlatformSpread: number;
}

export interface TrendEvidence {
  id: string;
  platform: SignalPlatform;
  sourceType: SignalSourceType;
  url: string;
  title?: string;
  detectedAt: string;
  metrics?: SocialMetrics;
}

export interface TrendObservation {
  topic: string;
  topicKey: string;
  platforms: SignalPlatform[];
  sourceTypes: SignalSourceType[];
  metrics: TrendMetrics;
  trendScore: number;
  confidence: number;
  evidenceCount: number;
  evidence: TrendEvidence[];
  detectedAt: string;
}

export interface ObservatoryRun {
  signals: SocialSignal[];
  observations: TrendObservation[];
  providerResults: Array<{
    provider: string;
    signals: number;
    error?: string;
  }>;
}

export interface PersistedTrendObservation {
  topic: string;
  topic_key: string;
  platforms: SignalPlatform[];
  source_types: SignalSourceType[];
  velocity: number;
  acceleration: number;
  engagement: number;
  novelty: number;
  cross_platform_spread: number;
  trend_score: number;
  confidence: number;
  evidence_count: number;
  evidence: TrendEvidence[];
  detected_at: string;
  detected_on: string;
}

export function isSignalPlatform(value: unknown): value is SignalPlatform {
  return typeof value === "string" && [
    "tiktok",
    "instagram",
    "youtube",
    "reddit",
    "x_twitter",
    "google",
    "github",
    "linkedin",
    "web",
  ].includes(value);
}

export function isSignalSourceType(value: unknown): value is SignalSourceType {
  return typeof value === "string" && [
    "official_newsroom",
    "creator_post",
    "trend_feed",
    "community_discussion",
    "competitor_content",
    "manual",
  ].includes(value);
}
