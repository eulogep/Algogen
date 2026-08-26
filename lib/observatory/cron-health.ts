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
    failure_reason: input.failureReason,
    articles_scraped: input.articlesScraped,
    analyzer_attempted: input.analyzerAttempted,
    analyzer_failed: input.analyzerFailed,
    signals_collected: input.signalsCollected,
    trends_detected: input.trendsDetected,
    updates_detected: input.updatesDetected,
    alert_kind: alertKind ?? null,
    metadata: input.metadata ?? {},
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
