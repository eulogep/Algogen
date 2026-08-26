import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeArticlesBatch } from "@/lib/algo-analyzer";
import { runObservatory } from "@/lib/observatory/collector";
import {
  createConfiguredSignalFeedProvider,
  createOfficialNewsroomProvider,
} from "@/lib/observatory/providers";
import { persistObservatoryResults } from "@/lib/observatory/persistence";
import {
  createSocialCrawlProvider,
  createXNewsroomFallbackProvider,
} from "@/lib/observatory/socialcrawl";
import type { TrendProvider } from "@/lib/observatory/types";
import { getSessionUser, getUserPlan } from "@/lib/plans";
import { scrapeAllSources, type ScrapedArticle } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 300;

// ── GET — Récupère les mises à jour sauvegardées ───────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("algorithm_updates")
      .select(
        "id, platform, source_title, summary, impact_level, signal_confidence, evidence_count, source_url, date_detected"
      )
      .order("date_detected", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updates: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST — Déclenche une veille à la demande (Pro/Student only) ───────────
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { plan } = await getUserPlan(user.id);
  if (plan === "free") {
    return NextResponse.json(
      { error: "UPGRADE_REQUIRED", feature: "veille", plan: "free" },
      { status: 403 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

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

    const observatory = await runObservatory(providers);
    const analysis = await analyzeArticlesBatch(officialArticles);
    const persisted = await persistObservatoryResults(analysis.updates, observatory.observations);

    return NextResponse.json({
      inserted: persisted.updatesInserted,
      observationsUpserted: persisted.observationsUpserted,
      articlesScraped: officialArticles.length,
      signalsCollected: observatory.signals.length,
      trendsDetected: observatory.observations.length,
      analyzerAttempted: analysis.attempted,
      analyzerFailed: analysis.failed,
      providers: observatory.providerResults,
      message: `${persisted.updatesInserted} changements et ${persisted.observationsUpserted} tendances sauvegardés`,
    });
  } catch (err) {
    console.error("[scrape-updates] erreur:", err);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}
