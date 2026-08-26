import { scrapeAllSources, type ScrapedArticle } from "@/lib/scraper";
import type {
  SignalPlatform,
  SignalSourceType,
  SocialSignal,
  TrendProvider,
  TrendProviderContext,
} from "./types";
import { isSignalPlatform, isSignalSourceType } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

function normalizePlatform(platform: string): SignalPlatform {
  const mappedPlatforms: Record<string, SignalPlatform> = {
    instagram_reels: "instagram",
    instagram_feed: "instagram",
    youtube_shorts: "youtube",
    youtube_longform: "youtube",
    twitter: "x_twitter",
    x_twitter: "x_twitter",
  };

  return mappedPlatforms[platform] ?? (isSignalPlatform(platform) ? platform : "web");
}

function articleToSignal(article: ScrapedArticle): SocialSignal {
  return {
    id: `official:${article.platform}:${article.url}:${article.title}`,
    platform: normalizePlatform(article.platform),
    sourceType: "official_newsroom",
    topic: article.title,
    url: article.url,
    title: article.title,
    publishedAt: article.publishedAt ?? article.scrapedAt,
    detectedAt: article.scrapedAt,
    evidence: article.content.slice(0, 500),
  };
}

/**
 * Préserve la collecte actuelle des blogs officiels tout en la présentant au
 * moteur de tendance dans un format identique aux sources sociales futures.
 */
export function createOfficialNewsroomProvider(
  collect: () => Promise<ScrapedArticle[]> = scrapeAllSources
): TrendProvider {
  return {
    id: "official-newsrooms",
    async fetchSignals(): Promise<SocialSignal[]> {
      const articles = await collect();
      return articles.map(articleToSignal);
    },
  };
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseFeedSignal(value: unknown, now: Date): SocialSignal | null {
  if (!isRecord(value)) return null;

  const id = asOptionalString(value.id);
  const platform = value.platform;
  const sourceType = value.sourceType;
  const topic = asOptionalString(value.topic);
  const url = asOptionalString(value.url);

  if (!id || !isSignalPlatform(platform) || !isSignalSourceType(sourceType) || !topic || !url) {
    return null;
  }

  const metricsValue = isRecord(value.metrics) ? value.metrics : undefined;
  const authorValue = isRecord(value.author) ? value.author : undefined;

  return {
    id,
    platform,
    sourceType: sourceType as SignalSourceType,
    topic,
    url,
    title: asOptionalString(value.title),
    publishedAt: asOptionalString(value.publishedAt) ?? now.toISOString(),
    detectedAt: asOptionalString(value.detectedAt) ?? now.toISOString(),
    metrics: metricsValue
      ? {
          views: asOptionalNumber(metricsValue.views),
          likes: asOptionalNumber(metricsValue.likes),
          comments: asOptionalNumber(metricsValue.comments),
          shares: asOptionalNumber(metricsValue.shares),
          followers: asOptionalNumber(metricsValue.followers),
          engagementRate: asOptionalNumber(metricsValue.engagementRate),
          viewsPerHour: asOptionalNumber(metricsValue.viewsPerHour),
        }
      : undefined,
    author: authorValue && asOptionalString(authorValue.id)
      ? {
          id: asOptionalString(authorValue.id)!,
          followers: asOptionalNumber(authorValue.followers),
        }
      : undefined,
    evidence: asOptionalString(value.evidence),
  };
}

/**
 * Connecteur HTTP générique pour une instance Trendgetter, SocialCrawl ou un
 * fournisseur interne. Le contrat est volontairement validé à l’exécution :
 * une réponse inattendue est ignorée sans arrêter l’ensemble de la veille.
 *
 * Réponse attendue : { "signals": SocialSignal[] }
 */
export function createConfiguredSignalFeedProvider(
  endpoint = process.env.ALGOLENS_SIGNAL_FEED_URL,
  bearerToken = process.env.ALGOLENS_SIGNAL_FEED_TOKEN
): TrendProvider | null {
  if (!endpoint) return null;

  return {
    id: "configured-signal-feed",
    async fetchSignals(context: TrendProviderContext): Promise<SocialSignal[]> {
      const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
      const signal = context.signal
        ? AbortSignal.any([context.signal, timeout])
        : timeout;
      const response = await fetch(endpoint, {
        headers: {
          Accept: "application/json",
          ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Signal feed returned HTTP ${response.status}`);
      }

      const body: unknown = await response.json();
      if (!isRecord(body) || !Array.isArray(body.signals)) {
        throw new Error("Signal feed response must expose a signals array");
      }

      return body.signals
        .map((item) => parseFeedSignal(item, context.now))
        .filter((item): item is SocialSignal => item !== null);
    },
  };
}
