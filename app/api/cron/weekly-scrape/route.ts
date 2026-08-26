import { NextRequest, NextResponse } from "next/server";
import { analyzeArticlesBatch } from "@/lib/algo-analyzer";
import { runObservatory } from "@/lib/observatory/collector";
import {
  createConfiguredSignalFeedProvider,
  createOfficialNewsroomProvider,
} from "@/lib/observatory/providers";
import { persistObservatoryResults } from "@/lib/observatory/persistence";
import { classifyCronStatus, recordCronHealth } from "@/lib/observatory/cron-health";
import { sendCronAlertEmail } from "@/lib/observatory/cron-alerts";
import {
  createSocialCrawlProvider,
  createXNewsroomFallbackProvider,
} from "@/lib/observatory/socialcrawl";
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
    const xNewsroomProvider = createXNewsroomFallbackProvider();
    const providers: TrendProvider[] = [
      officialProvider,
      ...(configuredProvider ? [configuredProvider] : []),
      ...(socialCrawlProvider ? [socialCrawlProvider] : []),
      ...(xNewsroomProvider ? [xNewsroomProvider] : []),
    ];

    const observatory = await runObservatory(providers, now);
    const analysis = await analyzeArticlesBatch(officialArticles);
    const persisted = await persistObservatoryResults(analysis.updates, observatory.observations);
    const durationMs = Date.now() - startedAt;
    const providerFailures = observatory.providerResults.filter((provider) => provider.error).length;
    const status = classifyCronStatus({
      articlesScraped: officialArticles.length,
      analyzerAttempted: analysis.attempted,
      analyzerFailed: analysis.failed,
      providerFailures,
    });
    const health = await recordCronHealth({
      jobName: "weekly-scrape",
      startedAt: now,
      status,
      failureReason:
        status === "failure"
          ? analysis.failures.slice(0, 3).join(" | ") || "Le cron n’a produit aucune analyse exploitable"
          : undefined,
      articlesScraped: officialArticles.length,
      analyzerAttempted: analysis.attempted,
      analyzerFailed: analysis.failed,
      signalsCollected: observatory.signals.length,
      trendsDetected: observatory.observations.length,
      updatesDetected: analysis.updates.length,
      metadata: { providerFailures, providers: observatory.providerResults },
    });

    const log = status === "failure" ? console.error : status === "degraded" ? console.warn : console.log;
    log(
      `[cron] ${status} en ${durationMs}ms — ${officialArticles.length} articles, ${observatory.observations.length} tendances, ${analysis.updates.length} changements, ${analysis.failed} échecs d’analyse`
    );
    let emailAlert = null;
    if (health.alertKind) {
      console.error(
        `[cron-alert] ${health.alertKind} — ${health.consecutiveFailures} échecs consécutifs pour weekly-scrape`
      );
      try {
        emailAlert = await sendCronAlertEmail({
          kind: health.alertKind,
          status,
          consecutiveFailures: health.consecutiveFailures,
          failureReason: analysis.failures.slice(0, 3).join(" | ") || undefined,
          articlesScraped: officialArticles.length,
          analyzerAttempted: analysis.attempted,
          analyzerFailed: analysis.failed,
          signalsCollected: observatory.signals.length,
          trendsDetected: observatory.observations.length,
        });
      } catch (emailError) {
        console.error("[cron-alert] Échec d’envoi email:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: status !== "failure",
        status,
        durationMs,
        articlesScraped: officialArticles.length,
        signalsCollected: observatory.signals.length,
        trendsDetected: observatory.observations.length,
        updatesDetected: analysis.updates.length,
        updatesInserted: persisted.updatesInserted,
        observationsUpserted: persisted.observationsUpserted,
        analyzerAttempted: analysis.attempted,
        analyzerFailed: analysis.failed,
        consecutiveFailures: health.consecutiveFailures,
        alertKind: health.alertKind ?? null,
        emailAlert,
        providers: observatory.providerResults,
        updates: analysis.updates.map((update) => ({
          platform: update.platform,
          impact_level: update.impact_level,
          confidence: update.confidence,
          summary: update.summary,
        })),
      },
      { status: status === "failure" ? 503 : 200 }
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[cron] Erreur algorithm-observatory:", err);
    try {
      const health = await recordCronHealth({
        jobName: "weekly-scrape",
        startedAt: now,
        status: "failure",
        failureReason: reason,
        articlesScraped: 0,
        analyzerAttempted: 0,
        analyzerFailed: 0,
        signalsCollected: 0,
        trendsDetected: 0,
        updatesDetected: 0,
      });
      if (health.alertKind) {
        console.error(
          `[cron-alert] ${health.alertKind} — ${health.consecutiveFailures} échecs consécutifs pour weekly-scrape`
        );
        try {
          await sendCronAlertEmail({
            kind: health.alertKind,
            status: "failure",
            consecutiveFailures: health.consecutiveFailures,
            failureReason: reason,
            articlesScraped: 0,
            analyzerAttempted: 0,
            analyzerFailed: 0,
            signalsCollected: 0,
            trendsDetected: 0,
          });
        } catch (emailError) {
          console.error("[cron-alert] Échec d’envoi email:", emailError);
        }
      }
    } catch (healthError) {
      console.error("[cron-health] Échec d’enregistrement:", healthError);
    }
    return NextResponse.json(
      { success: false, error: reason },
      { status: 500 }
    );
  }
}
