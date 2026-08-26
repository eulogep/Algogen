import { createClient as createSSRClient } from "@/lib/supabase/server";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  instagram_reels: "Instagram Reels",
  instagram_feed: "Instagram Feed",
  youtube: "YouTube",
  youtube_shorts: "YouTube Shorts",
  youtube_longform: "YouTube Long",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  x_twitter: "X / Twitter",
  google: "Google",
  reddit: "Reddit",
  github: "GitHub",
  web: "Web",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  instagram_reels: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  instagram_feed: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
  youtube: "bg-red-600 text-white",
  youtube_shorts: "bg-red-600 text-white",
  youtube_longform: "bg-red-700 text-white",
  linkedin: "bg-blue-700 text-white",
  twitter: "bg-gray-900 text-white",
  x_twitter: "bg-gray-900 text-white",
  google: "bg-blue-600 text-white",
  reddit: "bg-orange-600 text-white",
  github: "bg-slate-800 text-white",
  web: "bg-slate-600 text-white",
};

const IMPACT_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  high: {
    label: "Impact élevé",
    color: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  medium: {
    label: "Impact moyen",
    color: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Impact faible",
    color: "bg-green-100 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
};

interface AlgoUpdate {
  id: string;
  platform: string;
  summary: string;
  impact_level: "low" | "medium" | "high";
  affected_areas: string[];
  affected_formats: string[];
  action_for_creators: string;
  source_url: string;
  source_title: string;
  source_type: string;
  signal_confidence: number;
  evidence_count: number;
  date_detected: string;
}

interface TrendObservation {
  id: string;
  topic: string;
  platforms: string[];
  source_types: string[];
  velocity: number;
  acceleration: number;
  engagement: number;
  novelty: number;
  cross_platform_spread: number;
  trend_score: number;
  confidence: number;
  evidence_count: number;
  detected_at: string;
}

async function getUpdates(platform?: string): Promise<AlgoUpdate[]> {
  try {
    const supabase = await createSSRClient();
    let query = supabase
      .from("algorithm_updates")
      .select("*")
      .order("date_detected", { ascending: false })
      .limit(50);

    if (platform && platform !== "all") {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[updates] Erreur fetch:", error);
      return [];
    }
    return (data ?? []) as AlgoUpdate[];
  } catch (err) {
    console.error("[updates] Client error:", err);
    return [];
  }
}

async function getTrends(): Promise<TrendObservation[]> {
  try {
    const supabase = await createSSRClient();
    const { data, error } = await supabase
      .from("trend_observations")
      .select("*")
      .order("trend_score", { ascending: false })
      .order("detected_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("[updates] Erreur trends:", error);
      return [];
    }
    return (data ?? []) as TrendObservation[];
  } catch (err) {
    console.error("[updates] Trends client error:", err);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ platform?: string }>;
}

export default async function UpdatesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedPlatform = params.platform ?? "all";
  const [updates, trends] = await Promise.all([
    getUpdates(selectedPlatform),
    getTrends(),
  ]);

  const platforms = ["all", "tiktok", "instagram_reels", "youtube_shorts", "linkedin", "twitter"];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                Algorithm Observatory
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-950">
                Signaux, preuves et changements détectés
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Les sources sont conservées, les scores sont calculés et les recommandations restent vérifiables.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {trends.length} tendance{trends.length > 1 ? "s" : ""} classée{trends.length > 1 ? "s" : ""} · {updates.length} changement{updates.length > 1 ? "s" : ""} confirmé{updates.length > 1 ? "s" : ""}
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer par plateforme">
            {platforms.map((platform) => (
              <a
                key={platform}
                href={platform === "all" ? "/updates" : `/updates?platform=${platform}`}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedPlatform === platform
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {platform === "all" ? "Toutes" : PLATFORM_LABELS[platform]}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-7">
        <section aria-labelledby="trends-heading">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 id="trends-heading" className="text-lg font-bold text-slate-950">Tendances émergentes</h2>
              <p className="text-sm text-slate-500">Un score élevé ne constitue pas une certitude : vérifiez toujours les preuves associées.</p>
            </div>
          </div>
          {trends.length === 0 ? (
            <EmptyState message="Les prochaines collectes alimenteront ici les tendances multi-sources." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trends.map((trend) => <TrendCard key={trend.id} trend={trend} />)}
            </div>
          )}
        </section>

        <section aria-labelledby="changes-heading">
          <div className="mb-3">
            <h2 id="changes-heading" className="text-lg font-bold text-slate-950">Changements confirmés</h2>
            <p className="text-sm text-slate-500">Analyse de sources officielles avec une trace de provenance explicite.</p>
          </div>
          {updates.length === 0 ? (
            <EmptyState message="Aucun changement confirmé pour ce filtre. La veille planifiée publiera les prochaines observations sourcées." />
          ) : (
            <div className="space-y-4">{updates.map((update) => <UpdateCard key={update.id} update={update} />)}</div>
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function TrendCard({ trend }: { trend: TrendObservation }) {
  const platformLabels = trend.platforms.map((platform) => PLATFORM_LABELS[platform] ?? platform);
  const velocity = Number(trend.velocity).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-semibold text-slate-900">{trend.topic}</h3>
        <span className="rounded-md bg-indigo-50 px-2 py-1 text-sm font-bold text-indigo-700">{trend.trend_score}</span>
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">Trend score · 0–100</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Vélocité" value={`${velocity}/h`} />
        <Metric label="Engagement" value={`${Number(trend.engagement).toFixed(1)} %`} />
        <Metric label="Accélération" value={`${Number(trend.acceleration).toFixed(0)} %`} />
        <Metric label="Nouveauté" value={`${Number(trend.novelty).toFixed(0)} / 100`} />
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <ConfidenceBar confidence={trend.confidence} />
        <p className="mt-2 text-xs text-slate-500">{trend.evidence_count} preuve{trend.evidence_count > 1 ? "s" : ""} · {platformLabels.join(", ")}</p>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function UpdateCard({ update }: { update: AlgoUpdate }) {
  const impact = IMPACT_CONFIG[update.impact_level] ?? IMPACT_CONFIG.low;
  const platformLabel = PLATFORM_LABELS[update.platform] ?? update.platform;
  const platformColor = PLATFORM_COLORS[update.platform] ?? "bg-slate-700 text-white";
  const formattedDate = new Date(update.date_detected).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${platformColor}`}>{platformLabel}</span>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${impact.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${impact.dot}`} />
          {impact.label}
        </span>
        <span className="ml-auto text-xs text-slate-400">{formattedDate}</span>
      </div>

      <p className="font-medium leading-relaxed text-slate-800">{update.summary}</p>

      {update.action_for_creators && (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-700">Action recommandée</p>
          <p className="mt-0.5 text-sm text-blue-900">{update.action_for_creators}</p>
        </div>
      )}

      {(update.affected_areas?.length > 0 || update.affected_formats?.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...(update.affected_areas ?? []), ...(update.affected_formats ?? [])].map((area) => (
            <span key={area} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{area.replace(/_/g, " ")}</span>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
        <a href={update.source_url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-slate-500 underline hover:text-slate-700">
          Source officielle : {update.source_title}
        </a>
        <div>
          <ConfidenceBar confidence={update.signal_confidence} />
          <p className="mt-1 text-right text-xs text-slate-500">{update.evidence_count} preuve{update.evidence_count > 1 ? "s" : ""}</p>
        </div>
      </div>
    </article>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const value = Math.max(0, Math.min(100, Number(confidence) || 0));
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-slate-400";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Confiance</span><span>{value}/100</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}
