import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeAllSources } from "@/lib/scraper";
import { analyzeArticlesBatch } from "@/lib/algo-analyzer";
import { getSessionUser, getUserPlan } from "@/lib/plans";

// ── GET — Récupère les mises à jour sauvegardées ───────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("algorithm_updates")
      .select("id, platform, title, summary, impact_level, source_url, date_detected")
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
  // Gating : veille réservée Pro/Student
  const user = await getSessionUser();
  if (user) {
    const { plan } = await getUserPlan(user.id);
    if (plan === "free") {
      return NextResponse.json(
        { error: "UPGRADE_REQUIRED", feature: "veille", plan: "free" },
        { status: 403 }
      );
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // 1. Scraper
    const articles = await scrapeAllSources();
    
    if (articles.length === 0) {
       return NextResponse.json({
        inserted: 0,
        message: "Aucun article trouvé sur les blogs officiels",
      });
    }

    // 2. Analyser
    const updates = await analyzeArticlesBatch(articles);

    if (updates.length === 0) {
      return NextResponse.json({
        inserted: 0,
        message: "Aucune mise à jour détectée dans les articles récents",
      });
    }

    // 3. Sauvegarder (Persistance via service role)
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("algorithm_updates")
      .insert(
        updates.map((u) => ({
          platform: u.platform,
          summary: u.summary,
          impact_level: u.impact_level,
          affected_areas: u.affected_areas,
          action_for_creators: u.action_for_creators,
          source_url: u.source_url,
          source_title: u.source_title,
          date_detected: u.date_detected,
        }))
      )
      .select("id");

    if (error) {
       console.error("DB Insert error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      inserted: data?.length ?? 0,
      message: `${data?.length ?? 0} mises à jour détectées et sauvegardées`,
    });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}
