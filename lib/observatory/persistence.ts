import { createServiceClient } from "@/lib/supabase/service";
import type { AlgoUpdate } from "@/lib/algo-analyzer";
import { toPersistedObservation } from "./trend-engine";
import type { TrendObservation } from "./types";

export interface ObservatoryPersistenceResult {
  updatesInserted: number;
  observationsUpserted: number;
}

/** Évite les surrogates UTF-16 non appariés dans les colonnes jsonb Supabase. */
function sanitizeUnicode(value: string): string {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        output += value[index] + value[index + 1];
        index += 1;
      } else {
        output += "�";
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      output += "�";
    } else {
      output += value[index];
    }
  }
  return output;
}

function jsonSafe(value: unknown): unknown {
  if (typeof value === "string") return sanitizeUnicode(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        sanitizeUnicode(key),
        jsonSafe(entry),
      ])
    );
  }
  return value === undefined ? null : sanitizeUnicode(String(value));
}

function sanitizePersistenceRow<T extends object>(row: T): T {
  return jsonSafe(row) as T;
}

export async function persistObservatoryResults(
  updates: AlgoUpdate[],
  observations: TrendObservation[]
): Promise<ObservatoryPersistenceResult> {
  const supabase = createServiceClient();
  let updatesInserted = 0;
  let observationsUpserted = 0;

  if (updates.length > 0) {
    const rows = updates.map((update) =>
      sanitizePersistenceRow({
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
      })
    );

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
      .upsert(observations.map((observation) => {
        const persisted = toPersistedObservation(observation);
        return sanitizePersistenceRow(persisted);
      }), {
        onConflict: "topic_key,detected_on",
      })
      .select("id");

    if (error) throw error;
    observationsUpserted = data?.length ?? 0;
  }

  return { updatesInserted, observationsUpserted };
}
