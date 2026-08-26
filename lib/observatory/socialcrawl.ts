import type {
  SignalPlatform,
  SocialSignal,
  TrendProvider,
  TrendProviderContext,
} from "./types";

const SOCIALCRAWL_BASE_URL = "https://www.socialcrawl.dev/v1";
const REQUEST_TIMEOUT_MS = 20_000;

type SocialCrawlSource = "youtube" | "tiktok" | "instagram";

interface SocialCrawlPost {
  id?: unknown;
  url?: unknown;
  content?: {
    text?: unknown;
  };
  author?: {
    username?: unknown;
    followers?: unknown;
  };
  engagement?: {
    views?: unknown;
    likes?: unknown;
    comments?: unknown;
    shares?: unknown;
  };
  published_at?: unknown;
  ext?: {
    title?: unknown;
  };
}

interface SocialCrawlEnvelope {
  success?: unknown;
  data?: {
    items?: unknown;
  };
  error?: {
    type?: unknown;
    message?: unknown;
  };
}

interface SourceDefinition {
  source: SocialCrawlSource;
  platform: SignalPlatform;
  path: (region: string) => string;
}

const SOURCE_DEFINITIONS: Record<SocialCrawlSource, SourceDefinition> = {
  // 1 crédit : source initiale par défaut pour limiter le coût d’activation.
  youtube: {
    source: "youtube",
    platform: "youtube",
    path: (region) => `/youtube/videos/trending?region=${encodeURIComponent(region)}&max_results=25`,
  },
  // 5 crédits : à activer explicitement dans SOCIALCRAWL_SOURCES.
  tiktok: {
    source: "tiktok",
    platform: "tiktok",
    path: (region) => `/tiktok/trending?region=${encodeURIComponent(region)}`,
  },
  // 5 crédits : snapshot global, sans paramètre de région d’après la documentation.
  instagram: {
    source: "instagram",
    platform: "instagram",
    path: () => "/instagram/reels/trending",
  },
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function parseSources(value: string | undefined): SocialCrawlSource[] {
  const requested = (value ?? "youtube")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is SocialCrawlSource => item in SOURCE_DEFINITIONS);

  const selected: SocialCrawlSource[] = requested.length > 0 ? requested : ["youtube"];
  return [...new Set(selected)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSocialCrawlPost(value: unknown): value is SocialCrawlPost {
  return isRecord(value);
}

function safePublishedAt(value: unknown, fallback: string): string {
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value < 1_000_000_000_000 ? value * 1000 : value;
    return new Date(timestamp).toISOString();
  }
  return fallback;
}

function topicFromPost(post: SocialCrawlPost, fallback: string): string {
  const title = asString(post.ext?.title);
  const text = asString(post.content?.text);
  return (title ?? text ?? fallback).slice(0, 240);
}

function toSocialSignal(
  post: SocialCrawlPost,
  definition: SourceDefinition,
  index: number,
  now: Date
): SocialSignal {
  const fallbackUrl = `https://www.socialcrawl.dev/evidence/${definition.source}/${index}`;
  const id = asString(post.id) ?? `${definition.source}:${index}:${now.getTime()}`;
  const url = asString(post.url) ?? fallbackUrl;
  const title = asString(post.ext?.title);
  const publishedAt = safePublishedAt(post.published_at, now.toISOString());

  return {
    id: `socialcrawl:${definition.source}:${id}`,
    platform: definition.platform,
    sourceType: "trend_feed",
    topic: topicFromPost(post, `${definition.source} trending item ${index + 1}`),
    url,
    title,
    publishedAt,
    detectedAt: now.toISOString(),
    metrics: {
      views: asNumber(post.engagement?.views),
      likes: asNumber(post.engagement?.likes),
      comments: asNumber(post.engagement?.comments),
      shares: asNumber(post.engagement?.shares),
    },
    author: asString(post.author?.username)
      ? {
          id: asString(post.author?.username)!,
          followers: asNumber(post.author?.followers),
        }
      : undefined,
    evidence: title ?? asString(post.content?.text),
  };
}

async function fetchSource(
  definition: SourceDefinition,
  apiKey: string,
  region: string,
  context: TrendProviderContext
): Promise<SocialSignal[]> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = context.signal
    ? AbortSignal.any([context.signal, timeout])
    : timeout;
  const response = await fetch(`${SOCIALCRAWL_BASE_URL}${definition.path(region)}`, {
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
      "Idempotency-Key": crypto.randomUUID(),
    },
    signal,
  });

  const body = (await response.json().catch(() => null)) as SocialCrawlEnvelope | null;
  if (!response.ok || body?.success !== true) {
    const errorType = asString(body?.error?.type) ?? `HTTP_${response.status}`;
    const errorMessage = asString(body?.error?.message) ?? "SocialCrawl request failed";
    throw new Error(`SocialCrawl ${definition.source}: ${errorType} — ${errorMessage}`);
  }

  const items = Array.isArray(body.data?.items)
    ? body.data.items.filter(isSocialCrawlPost)
    : [];

  return items.map((post, index) => toSocialSignal(post, definition, index, context.now));
}

/**
 * Collecte directement les instantanés publics de SocialCrawl. La clé demeure
 * exclusivement côté serveur. Sans clé, ce fournisseur n’est pas enregistré.
 */
export function createSocialCrawlProvider(
  apiKey = process.env.SOCIALCRAWL_API_KEY,
  sources = process.env.SOCIALCRAWL_SOURCES,
  region = process.env.SOCIALCRAWL_REGION ?? "US"
): TrendProvider | null {
  if (!apiKey) return null;
  const enabledSources = parseSources(sources);

  return {
    id: `socialcrawl:${enabledSources.join(",")}`,
    async fetchSignals(context: TrendProviderContext): Promise<SocialSignal[]> {
      const results = await Promise.allSettled(
        enabledSources.map((source) =>
          fetchSource(SOURCE_DEFINITIONS[source], apiKey, region, context)
        )
      );

      const signals: SocialSignal[] = [];
      const failures: string[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          signals.push(...result.value);
        } else {
          failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
        }
      }

      if (signals.length === 0 && failures.length > 0) {
        throw new Error(failures.join(" | "));
      }
      if (failures.length > 0) {
        console.warn("[socialcrawl] partial collection:", failures.join(" | "));
      }

      return signals;
    },
  };
}
