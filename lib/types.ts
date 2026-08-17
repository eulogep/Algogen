// ──────────────────────────────────────────────
// AlgoLens — TypeScript Interfaces
// ──────────────────────────────────────────────

export type PlatformId =
  | "tiktok"
  | "instagram_reels"
  | "instagram_feed"
  | "youtube_shorts"
  | "youtube_longform"
  | "linkedin"
  | "x_twitter";

export interface PlatformMeta {
  id: PlatformId;
  label: string;
  shortDescription: string;
  color: string;
  gradient: string;
  icon: string; // emoji
}

export interface RankingSignal {
  signal: string;
  weight: "very_high" | "high" | "medium" | "low";
  description: string;
}

export interface PostingWindow {
  best_times_utc: string[];
  best_days: string[];
  notes: string;
}

export interface AlgorithmData {
  platform: string;
  content_type?: string;
  algorithm_name: string;
  ranking_signals: {
    primary: RankingSignal[];
    secondary: string[];
  };
  favored_behaviors: string[];
  penalized_behaviors: string[];
  optimal_posting_frequency: {
    recommended: string;
    minimum: string;
    notes: string;
  };
  top_formats: string[];
  recommended_posting_windows: PostingWindow;
  technical_specs: Record<string, unknown>;
  sources: string[];
}

export interface KnowledgeBaseMetadata {
  title: string;
  description: string;
  version: string;
  last_updated: string;
  usage_note: string;
}

export interface SocialAlgorithmsDB {
  _meta: KnowledgeBaseMetadata;
  platforms: Record<PlatformId, AlgorithmData>;
}

// ──────────────────────────────────────────────
// User Profile
// ──────────────────────────────────────────────

export type ContentType =
  | "educational"
  | "entertainment"
  | "sales"
  | "personal_branding"
  | "news"
  | "lifestyle"
  | "other";

export type Objective =
  | "visibility"
  | "subscribers"
  | "sales"
  | "engagement"
  | "brand_awareness";

export type Level = "beginner" | "intermediate" | "advanced";

export interface UserProfile {
  niche: string;
  contentType: ContentType;
  targetAudience: string;
  objective: Objective;
  currentFrequency: string;
  level: Level;
}

// ──────────────────────────────────────────────
// API Request / Response
// ──────────────────────────────────────────────

export interface AnalyzeRequest {
  platform: PlatformId;
  userProfile: UserProfile;
}

export interface WeeklyPlan {
  week1: string;
  week2: string;
  week3: string;
  week4: string;
}

export type AnalysisDataMode =
  | "static_editorial_context"
  | "cache"
  | "fallback";

export type AnalysisConfidence = "high" | "medium" | "low";

export interface AnalysisMetadata {
  data_mode: AnalysisDataMode;
  knowledge_base: KnowledgeBaseMetadata;
  assessed_at: string;
  confidence: AnalysisConfidence;
  source_urls: string[];
  limitations: string[];
}

export interface RecommendedExperiment {
  experiment: string;
  hypothesis: string;
  primary_metric: string;
  test_window: string;
  decision_rule: string;
}

export interface AnalyzeResponse {
  algorithm_summary: string;
  potential_score: number;           // 0–100
  score_justification: string;       // 1-sentence explanation of the score
  quick_wins: string[];              // exactly 3 actions to do in 48h
  top_5_levers: string[];
  weekly_plan: WeeklyPlan;
  content_examples: string[];
  mistakes_to_avoid: string[];
  experiments: RecommendedExperiment[];
  analysis_metadata: AnalysisMetadata;
}

// ── Comparison mode ─────────────────────────────────────────────────────────

export interface CompareRequest {
  platforms: [PlatformId, PlatformId];
  userProfile: UserProfile;
}

export interface CompareResponse {
  [platformId: string]: AnalyzeResponse;
}

// ── History ──────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;           // crypto.randomUUID()
  platformId: PlatformId;
  niche: string;
  objective: Objective;
  level: Level;
  score: number;        // potential_score snapshot
  date: string;         // ISO date string
  strategy: AnalyzeResponse;
}


