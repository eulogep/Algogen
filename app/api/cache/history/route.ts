import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// On utilise Supabase Client Public pour de la simple requête 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data: rows, error } = await supabase
      .from("cache_stats_history")
      .select("recorded_at, l1_hit_rate, l2_hit_rate, miss_rate, total_requests, estimated_savings_dollars")
      .order("recorded_at", { ascending: false })
      .limit(48); // Les 48 dernières demi-heures = Dernières 24h

    if (error) {
      throw error;
    }

    // On inverse le tableau pour que le graphique React ait les données chronologiques (gauche à droite)
    const history = (rows || []).reverse().map(row => ({
      timestamp: row.recorded_at,
      l1HitRate: row.l1_hit_rate,
      l2HitRate: row.l2_hit_rate,
      missRate: row.miss_rate,
      totalRequests: row.total_requests,
      savings: row.estimated_savings_dollars,
    }));

    return NextResponse.json({ history });
  } catch (err: any) {
    console.error("Erreur read history:", err);
    return NextResponse.json({ error: "Impossible de récupérer l'historique" }, { status: 500 });
  }
}
