import { NextRequest, NextResponse } from "next/server";
import { analyzeArticlesBatch } from "@/lib/algo-analyzer";
import { runObservatory } from "@/lib/observatory/collector";
import {
  createConfiguredSignalFeedProvider,
  createOfficialNewsroomProvider,
} from "@/lib/observatory/providers";
import { persistObservatoryResults } from "@/lib/observatory/persistence";
import { createSocialCrawlProvider } from "@/lib/observatory/socialcrawl";
import type { TrendProvider } from "@/lib/observatory/types";
import { scrapeAllSources, type ScrapedArticle } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Veille planifiée : les newsrooms officielles restent la source de référence
 * des changements confirmés, tandis que l'observatoire agrége en parallèle les
 * signaux configurés afin de classer les sujets émergents et leurs preuves.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.VERCEL_CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const now = new Date();
  console.log("[cron] algorithm-observatory démarré");

  try {
    let officialArticles: ScrapedArticle[] = [];
    const officialProvider = createOfficialNewsroomProvider(async () => {
      officialArticles = await scrapeAllSources();
      return officialArticles;
    });
    const configuredProvider = createConfiguredSignalFeedProvider();
    const socialCrawlProvider = createSocialCrawlProvider();
    const providers: TrendProvider[] = [
      officialProvider,
      ...(configuredProvider ? [configuredProvider] : []),
      ...(socialCrawlProvider ? [socialCrawlProvider] : []),
    ];

    const observatory = await runObservatory(providers, now);
    const updates = await analyzeArticlesBatch(officialArticles);
    const persisted = await persistObservatoryResults(updates, observatory.observations);
    const durationMs = Date.now() - startedAt;

    console.log(
      `[cron] terminé en ${durationMs}ms — ${officialArticles.length} articles, ${observatory.observations.length} tendances, ${updates.length} changements`
    );

    return NextResponse.json({
      success: true,
      durationMs,
      articlesScraped: officialArticles.length,
      signalsCollected: observatory.signals.length,
      trendsDetected: observatory.observations.length,
      updatesDetected: updates.length,
      updatesInserted: persisted.updatesInserted,
      observationsUpserted: persisted.observationsUpserted,
      providers: observatory.providerResults,
      updates: updates.map((update) => ({
        platform: update.platform,
        impact_level: update.impact_level,
        confidence: update.confidence,
        summary: update.summary,
      })),
    });
  } catch (err) {
    console.error("[cron] Erreur algorithm-observatory:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
