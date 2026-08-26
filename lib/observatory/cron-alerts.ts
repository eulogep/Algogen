import type { CronAlertKind, CronHealthStatus } from "./cron-health";

interface CronAlertEmailInput {
  kind: CronAlertKind;
  status: CronHealthStatus;
  consecutiveFailures: number;
  failureReason?: string;
  articlesScraped: number;
  analyzerAttempted: number;
  analyzerFailed: number;
  signalsCollected: number;
  trendsDetected: number;
}

export interface CronAlertEmailResult {
  sent: boolean;
  reason?: "not_configured";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmail(input: CronAlertEmailInput): { subject: string; html: string; text: string } {
  if (input.kind === "recovered") {
    return {
      subject: "[AlgoLens] Cron weekly-scrape rétabli",
      text: "Le cron weekly-scrape a réussi après une série d’échecs. La collecte et le pipeline d’observatoire sont de nouveau opérationnels.",
      html: "<h2>Cron weekly-scrape rétabli</h2><p>Le cron a réussi après une série d’échecs. La collecte et le pipeline d’observatoire sont de nouveau opérationnels.</p>",
    };
  }

  const reason = input.failureReason ?? "Cause non précisée";
  return {
    subject: `[AlgoLens] Alerte : ${input.consecutiveFailures} échecs consécutifs du cron`,
    text: [
      `Le cron weekly-scrape a atteint ${input.consecutiveFailures} échecs consécutifs.`,
      `Cause : ${reason}`,
      `Articles : ${input.articlesScraped}; analyses Claude : ${input.analyzerAttempted}; échecs Claude : ${input.analyzerFailed}; signaux : ${input.signalsCollected}; tendances : ${input.trendsDetected}.`,
      "Consultez les logs Vercel et la table Supabase cron_run_health.",
    ].join("\n"),
    html: [
      `<h2>Alerte cron weekly-scrape</h2>`,
      `<p>Le cron a atteint <strong>${input.consecutiveFailures} échecs consécutifs</strong>.</p>`,
      `<p><strong>Cause :</strong> ${escapeHtml(reason)}</p>`,
      `<ul><li>Articles : ${input.articlesScraped}</li><li>Analyses Claude : ${input.analyzerAttempted}</li><li>Échecs Claude : ${input.analyzerFailed}</li><li>Signaux : ${input.signalsCollected}</li><li>Tendances : ${input.trendsDetected}</li></ul>`,
      `<p>Consultez les logs Vercel et la table Supabase <code>cron_run_health</code>.</p>`,
    ].join(""),
  };
}

/**
 * Envoie l’alerte par l’API Resend lorsque toutes les variables serveur sont
 * présentes. L’absence de configuration ne doit jamais faire échouer le cron.
 */
export async function sendCronAlertEmail(
  input: CronAlertEmailInput
): Promise<CronAlertEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CRON_ALERT_EMAIL;
  const from = process.env.CRON_ALERT_FROM;
  if (!apiKey || !recipient || !from) {
    console.warn("[cron-alert] Email non configuré : RESEND_API_KEY, CRON_ALERT_EMAIL ou CRON_ALERT_FROM manquant");
    return { sent: false, reason: "not_configured" };
  }

  const email = buildEmail(input);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  return { sent: true };
}
