/**
 * app/api/cron/weekly-scrape/route.ts
 * Cron Vercel → chaque lundi 8h UTC
 * Scrape toutes les sources + analyse avec Claude + save en DB
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { scrapeAllSources } from "@/lib/scraper";
import { analyzeArticlesBatch } from "@/lib/algo-analyzer";
import type { AlgoUpdate } from "@/lib/algo-analyzer";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max (Vercel Pro)

export async function GET(req: NextRequest) {
  // Vérification sécurité cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.VERCEL_CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  console.log("[cron] weekly-scrape démarré");

  try {
    // 1. Scraper toutes les sources
    const articles = await scrapeAllSources();
    console.log(`[cron] ${articles.length} articles scrapés`);

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        articlesScraped: 0,
        updatesDetected: 0,
        message: "Aucun article trouvé",
      });
    }

    // 2. Analyser avec Claude
    const updates = await analyzeArticlesBatch(articles);
    console.log(`[cron] ${updates.length} mises à jour détectées`);

    // 3. Sauvegarder en DB
    if (updates.length > 0) {
      await saveUpdatesToDB(updates);
    }

    const duration = Date.now() - startedAt;
    console.log(`[cron] Terminé en ${duration}ms`);

    return NextResponse.json({
      success: true,
      articlesScraped: articles.length,
      updatesDetected: updates.length,
      durationMs: duration,
      updates: updates.map((u) => ({
        platform: u.platform,
        impact_level: u.impact_level,
        summary: u.summary,
      })),
    });
  } catch (err) {
    console.error("[cron] Erreur weekly-scrape:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

async function saveUpdatesToDB(updates: AlgoUpdate[]): Promise<void> {
  const supabase = createServiceClient();
  const rows = updates.map((u) => ({
    platform: u.platform,
    summary: u.summary,
    impact_level: u.impact_level,
    affected_areas: u.affected_areas,
    action_for_creators: u.action_for_creators,
    source_url: u.source_url,
    source_title: u.source_title,
    date_detected: u.date_detected,
  }));

  const { error } = await supabase.from("algorithm_updates").insert(rows);

  if (error) {
    console.error("[cron] Erreur sauvegarde DB:", error);
    throw error;
  }

  console.log(`[cron] ${rows.length} updates sauvegardées en DB`);
}
