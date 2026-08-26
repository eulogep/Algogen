import { createServiceClient } from "@/lib/supabase/service";

export type CronHealthStatus = "success" | "degraded" | "failure";
export type CronAlertKind = "failure_threshold" | "recovered";

export interface CronHealthInput {
  jobName: string;
  startedAt: Date;
  status: CronHealthStatus;
  failureReason?: string;
  articlesScraped: number;
  analyzerAttempted: number;
  analyzerFailed: number;
  signalsCollected: number;
  trendsDetected: number;
  updatesDetected: number;
  metadata?: Record<string, unknown>;
}

export interface CronHealthResult {
  consecutiveFailures: number;
  alertKind?: CronAlertKind;
}

const FAILURE_THRESHOLD = 3;

function isFailure(status: CronHealthStatus): boolean {
  return status === "failure";
}

/** PostgreSQL jsonb rejette les surrogates UTF-16 non appariés. */
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

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "string") return sanitizeUnicode(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        sanitizeUnicode(key),
        toJsonSafe(entry),
      ])
    );
  }
  return value === undefined ? null : sanitizeUnicode(String(value));
}

export async function recordCronHealth(input: CronHealthInput): Promise<CronHealthResult> {
  const supabase = createServiceClient();
  const { data: latest, error: latestError } = await supabase
    .from("cron_run_health")
    .select("status")
    .eq("job_name", input.jobName)
    .order("finished_at", { ascending: false })
    .limit(FAILURE_THRESHOLD)
    .returns<Array<{ status: CronHealthStatus }>>();

  if (latestError) throw latestError;

  let priorConsecutiveFailures = 0;
  for (const run of latest ?? []) {
    if (!isFailure(run.status)) break;
    priorConsecutiveFailures += 1;
  }
  const consecutiveFailures = isFailure(input.status)
    ? priorConsecutiveFailures + 1
    : 0;
  const priorWasAlerting = priorConsecutiveFailures >= FAILURE_THRESHOLD;
  const alertKind: CronAlertKind | undefined =
    input.status === "failure" && consecutiveFailures === FAILURE_THRESHOLD
      ? "failure_threshold"
      : input.status === "success" && priorWasAlerting
        ? "recovered"
        : undefined;

  const { error: insertError } = await supabase.from("cron_run_health").insert({
    job_name: input.jobName,
    started_at: input.startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    status: input.status,
    failure_reason: input.failureReason ? sanitizeUnicode(input.failureReason) : null,
    articles_scraped: input.articlesScraped,
    analyzer_attempted: input.analyzerAttempted,
    analyzer_failed: input.analyzerFailed,
    signals_collected: input.signalsCollected,
    trends_detected: input.trendsDetected,
    updates_detected: input.updatesDetected,
    alert_kind: alertKind ?? null,
    metadata: toJsonSafe(input.metadata ?? {}),
  });

  if (insertError) throw insertError;

  return { consecutiveFailures, alertKind };
}

export function classifyCronStatus(input: {
  articlesScraped: number;
  analyzerAttempted: number;
  analyzerFailed: number;
  providerFailures: number;
  fatalError?: string;
}): CronHealthStatus {
  if (input.fatalError) return "failure";
  if (
    input.analyzerAttempted > 0 &&
    input.analyzerFailed === input.analyzerAttempted
  ) {
    return "failure";
  }
  if (input.providerFailures > 0 || input.analyzerFailed > 0) return "degraded";
  return "success";
}
