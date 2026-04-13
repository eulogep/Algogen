// ── AlgoLens — History operations (Supabase, client-side) ─────────────────
// Use only in "use client" components.

import { createClient } from "./client";
import type { HistoryEntry, PlatformId, AnalyzeResponse, Objective, Level } from "@/lib/types";

// ── Fetch ─────────────────────────────────────────────────────────────────
export async function fetchHistory(): Promise<HistoryEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("analysis_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    platformId: row.platform_id as PlatformId,
    niche: row.niche as string,
    objective: row.objective as Objective,
    level: row.level as Level,
    score: row.score as number,
    date: row.created_at as string,
    strategy: row.strategy as AnalyzeResponse,
  }));
}

// ── Insert ─────────────────────────────────────────────────────────────────
export async function insertHistory(
  platformId: PlatformId,
  niche: string,
  objective: Objective,
  level: Level,
  strategy: AnalyzeResponse
): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("analysis_history")
    .insert({
      user_id: user.id,
      platform_id: platformId,
      niche,
      objective,
      level,
      score: strategy.potential_score ?? 0,
      strategy,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id as string;
}

// ── Delete ─────────────────────────────────────────────────────────────────
export async function removeHistory(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("analysis_history").delete().eq("id", id);
}

// ── Clear all ──────────────────────────────────────────────────────────────
export async function removeAllHistory(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("analysis_history").delete().eq("user_id", user.id);
}
