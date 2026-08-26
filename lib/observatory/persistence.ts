import { createServiceClient } from "@/lib/supabase/service";
import type { AlgoUpdate } from "@/lib/algo-analyzer";
import { toPersistedObservation } from "./trend-engine";
import type { TrendObservation } from "./types";

export interface ObservatoryPersistenceResult {
  updatesInserted: number;
  observationsUpserted: number;
}

export async function persistObservatoryResults(
  updates: AlgoUpdate[],
  observations: TrendObservation[]
): Promise<ObservatoryPersistenceResult> {
  const supabase = createServiceClient();
  let updatesInserted = 0;
  let observationsUpserted = 0;

  if (updates.length > 0) {
    const rows = updates.map((update) => ({
      platform: update.platform,
      summary: update.summary,
      impact_level: update.impact_level,
      affected_areas: update.affected_areas,
      action_for_creators: update.action_for_creators,
      source_url: update.source_url,
      source_title: update.source_title,
      date_detected: update.date_detected,
      signal_confidence: update.confidence,
      evidence_count: update.evidenceCount,
      source_type: update.sourceType,
      affected_formats: update.affectedFormats,
      affected_creators: update.affectedCreators,
      observatory_evidence: update.evidence,
    }));

    const { data, error } = await supabase
      .from("algorithm_updates")
      .insert(rows)
      .select("id");

    if (error) throw error;
    updatesInserted = data?.length ?? 0;
  }

  if (observations.length > 0) {
    const { data, error } = await supabase
      .from("trend_observations")
      .upsert(observations.map(toPersistedObservation), {
        onConflict: "topic_key,detected_on",
      })
      .select("id");

    if (error) throw error;
    observationsUpserted = data?.length ?? 0;
  }

  return { updatesInserted, observationsUpserted };
}
