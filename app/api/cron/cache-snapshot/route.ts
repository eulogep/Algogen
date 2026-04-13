import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCacheStats } from "@/lib/cache"; // Accès direct au cache in-memory

export const runtime = "nodejs";
export const maxDuration = 30; // 30 secondes max pour ce petit script

// Service Role pour contourner RLS sur les tables internes sans jeton d'utilisateur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  // 1. Sécurité Vercel Cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.VERCEL_CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Extraire les statistiques locales de l'instance
    const stats = getCacheStats();
    
    // S'il n'y a pas encore eu la moindre requête, pas besoin de créer des graphiques plats
    if (stats.totalRequests === 0) {
      return NextResponse.json({ message: "No requests recorded yet, skipping snapshot." });
    }

    // 3. Vérifier la dernière ligne pour éviter les doublons 
    // (Si total_requests n'a pas bougé depuis 30 min, on skip)
    const { data: lastSnapshot } = await supabase
      .from("cache_stats_history")
      .select("total_requests")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (lastSnapshot && lastSnapshot.total_requests === stats.totalRequests) {
      return NextResponse.json({ message: "No new requests since last snapshot, skipping." });
    }

    // 4. Préparer les données
    const missRate = Math.round((stats.misses / stats.totalRequests) * 100);
    const estimatedSavings = parseFloat(((stats.l1Hits + stats.l2Hits) * 0.01).toFixed(2));

    // 5. Insérer le snapshot
    const { error } = await supabase.from("cache_stats_history").insert({
      l1_hits: stats.l1Hits,
      l2_hits: stats.l2Hits,
      misses: stats.misses,
      total_requests: stats.totalRequests,
      l1_hit_rate: stats.l1HitRate,
      l2_hit_rate: stats.l2HitRate,
      miss_rate: missRate,
      estimated_savings_dollars: estimatedSavings
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      snapshot: {
        total_requests: stats.totalRequests,
        estimated_savings_dollars: estimatedSavings
      }
    });

  } catch (error: any) {
    console.error("[Cron Cache Snapshot Error]:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message }, { status: 500 });
  }
}
