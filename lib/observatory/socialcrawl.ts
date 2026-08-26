import type {
  SignalPlatform,
  SocialSignal,
  TrendProvider,
  TrendProviderContext,
} from "./types";

const SOCIALCRAWL_BASE_URL = "https://www.socialcrawl.dev/v1";
const REQUEST_TIMEOUT_MS = 20_000;

type SocialCrawlSource = "youtube" | "tiktok" | "instagram";
type SocialCrawlProviderSource = SocialCrawlSource | "twitter";

type UnknownRecord = Record<string, unknown>;

interface SocialCrawlPost {
  id?: unknown;
  url?: unknown;
  title?: unknown;
  content?: {
    text?: unknown;
    title?: unknown;
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
  created_at?: unknown;
  text?: unknown;
  ext?: {
    title?: unknown;
    description?: unknown;
  };
}

interface SocialCrawlComputed {
  engagement_rate?: unknown;
}

interface SocialCrawlEnvelope {
  success?: unknown;
  data?: {
    items?: unknown;
    posts?: unknown;
    tweets?: unknown;
  };
  error?: {
    type?: unknown;
    message?: unknown;
  };
}

interface SourceDefinition {
  source: SocialCrawlProviderSource;
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

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function asPercent(value: unknown): number | undefined {
  const numeric = asNumber(value);
  if (numeric === undefined) return undefined;
  // SocialCrawl renvoie engagement_rate comme ratio (0.14949 = 14.949 %).
  return numeric <= 1 ? numeric * 100 : numeric;
}

function parseSources(value: string | undefined): SocialCrawlSource[] {
  const requested = (value ?? "youtube")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is SocialCrawlSource => item in SOURCE_DEFINITIONS);

  const selected: SocialCrawlSource[] = requested.length > 0 ? requested : ["youtube"];
  return [...new Set(selected)];
}

/**
 * Les listes SocialCrawl suivent le contrat unifié : data.items[] contient
 * { post: {...}, computed: {...} }. Le repli plat conserve la compatibilité
 * avec d’anciens adaptateurs et réponses déjà normalisées.
 */
function unwrapSocialCrawlItem(
  value: unknown
): { post: SocialCrawlPost; computed?: SocialCrawlComputed } | null {
  if (!isRecord(value)) return null;

  if (isRecord(value.post)) {
    return {
      post: value.post as SocialCrawlPost,
      computed: isRecord(value.computed) ? (value.computed as SocialCrawlComputed) : undefined,
    };
  }

  return { post: value as SocialCrawlPost };
}

function safePublishedAt(value: unknown, fallback: string): string {
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value < 1_000_000_000_000 ? value * 1000 : value;
    return new Date(timestamp).toISOString();
  }
  return fallback;
}

function titleFromPost(post: SocialCrawlPost): string | undefined {
  return (
    asString(post.title) ??
    asString(post.text) ??
    asString(post.content?.title) ??
    asString(post.ext?.title) ??
    asString(post.content?.text) ??
    asString(post.ext?.description)
  );
}

function topicFromPost(post: SocialCrawlPost, fallback: string): string {
  return (titleFromPost(post) ?? fallback).slice(0, 240);
}

function toSocialSignal(
  post: SocialCrawlPost,
  computed: SocialCrawlComputed | undefined,
  definition: SourceDefinition,
  index: number,
  now: Date,
  sourceType: SocialSignal["sourceType"] = "trend_feed"
): SocialSignal {
  const fallbackUrl = `https://www.socialcrawl.dev/evidence/${definition.source}/${index}`;
  const id = asString(post.id) ?? `${definition.source}:${index}:${now.getTime()}`;
  const url = asString(post.url) ?? fallbackUrl;
  const title = titleFromPost(post);
  const publishedAt = safePublishedAt(post.published_at ?? post.created_at, now.toISOString());

  return {
    id: `socialcrawl:${definition.source}:${id}`,
    platform: definition.platform,
    sourceType,
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
      engagementRate: asPercent(computed?.engagement_rate),
    },
    author: asString(post.author?.username)
      ? {
          id: asString(post.author?.username)!,
          followers: asNumber(post.author?.followers),
        }
      : undefined,
    evidence: title ?? asString(post.content?.text) ?? asString(post.ext?.description),
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

  const items = Array.isArray(body.data?.items) ? body.data.items : [];
  return items
    .map(unwrapSocialCrawlItem)
    .filter((item): item is { post: SocialCrawlPost; computed?: SocialCrawlComputed } => item !== null)
    .map((item, index) => toSocialSignal(item.post, item.computed, definition, index, context.now));
}

const X_NEWSROOM_DEFINITION: SourceDefinition = {
  source: "twitter",
  platform: "x_twitter",
  path: () => "/twitter/user/tweets",
};

function parseXHandles(value: string | undefined): string[] {
  const handles = (value ?? "XDevelopers,X")
    .split(",")
    .map((handle) => handle.trim().replace(/^@/, ""))
    .filter((handle) => /^[A-Za-z0-9_]{1,15}$/.test(handle));
  return [...new Set(handles)];
}

function socialCrawlItems(body: SocialCrawlEnvelope | null): unknown[] {
  const data = body?.data;
  if (!data) return [];
  if (Array.isArray(data.posts)) return data.posts;
  if (Array.isArray(data.tweets)) return data.tweets;
  return Array.isArray(data.items) ? data.items : [];
}

async function fetchXNewsroomHandle(
  handle: string,
  apiKey: string,
  context: TrendProviderContext
): Promise<SocialSignal[]> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = context.signal
    ? AbortSignal.any([context.signal, timeout])
    : timeout;
  const response = await fetch(
    `${SOCIALCRAWL_BASE_URL}/twitter/user/tweets?handle=${encodeURIComponent(handle)}&trim=true`,
    {
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
        "Idempotency-Key": crypto.randomUUID(),
      },
      signal,
    }
  );
  const body = (await response.json().catch(() => null)) as SocialCrawlEnvelope | null;
  if (!response.ok || body?.success !== true) {
    const errorType = asString(body?.error?.type) ?? `HTTP_${response.status}`;
    const errorMessage = asString(body?.error?.message) ?? "SocialCrawl X request failed";
    throw new Error(`SocialCrawl X @${handle}: ${errorType} — ${errorMessage}`);
  }

  return socialCrawlItems(body)
    .map(unwrapSocialCrawlItem)
    .filter((item): item is { post: SocialCrawlPost; computed?: SocialCrawlComputed } => item !== null)
    .slice(0, 12)
    .map((item, index) =>
      toSocialSignal(item.post, item.computed, X_NEWSROOM_DEFINITION, index, context.now, "official_newsroom")
    );
}

/**
 * Remplace le scraping HTML de blog.x.com, bloqué en 403, par les publications
 * des comptes officiels X collectées via SocialCrawl. Sans clé, aucun appel n’est fait.
 */
export function createXNewsroomFallbackProvider(
  apiKey = process.env.SOCIALCRAWL_API_KEY,
  handles = process.env.SOCIALCRAWL_X_HANDLES
): TrendProvider | null {
  if (!apiKey) return null;
  const configuredHandles = parseXHandles(handles);
  if (configuredHandles.length === 0) return null;

  return {
    id: `socialcrawl:x-newsroom:${configuredHandles.join(",")}`,
    async fetchSignals(context: TrendProviderContext): Promise<SocialSignal[]> {
      const results = await Promise.allSettled(
        configuredHandles.map((handle) => fetchXNewsroomHandle(handle, apiKey, context))
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
        console.warn("[socialcrawl] X newsroom partial collection:", failures.join(" | "));
      }
      return [...new Map(signals.map((signal) => [signal.id, signal])).values()];
    },
  };
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
