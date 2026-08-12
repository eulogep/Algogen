import { createClient as createSSRClient } from "@/lib/supabase/server";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram_reels: "Instagram Reels",
  instagram_feed: "Instagram Feed",
  youtube_shorts: "YouTube Shorts",
  youtube_longform: "YouTube Long",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  instagram_reels: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  instagram_feed: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
  youtube_shorts: "bg-red-600 text-white",
  youtube_longform: "bg-red-700 text-white",
  linkedin: "bg-blue-700 text-white",
  twitter: "bg-gray-900 text-white",
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
  action_for_creators: string;
  source_url: string;
  source_title: string;
  date_detected: string;
  created_at: string;
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
    return data ?? [];
  } catch (err) {
    console.error("[updates] Client error:", err);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ platform?: string }>;
}

export default async function UpdatesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedPlatform = params.platform ?? "all";

  const updates = await getUpdates(selectedPlatform);

  const platforms = ["all", ...Object.keys(PLATFORM_LABELS)];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🔍 Veille Algorithmique
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Mise à jour automatique chaque lundi · {updates.length} changements détectés · sources vérifiées uniquement
              </p>
            </div>
          </div>

          {/* Filtres plateforme */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {platforms.map((p) => (
              <a
                key={p}
                href={p === "all" ? "/updates" : `/updates?platform=${p}`}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedPlatform === p
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "all" ? "Toutes" : PLATFORM_LABELS[p]}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {updates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">Aucun changement détecté</p>
            <p className="text-sm mt-1">La veille planifiée publiera ici les prochains changements sourcés.</p>
          </div>
        ) : (
          updates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))
        )}
      </div>
    </div>
  );
}

function UpdateCard({ update }: { update: AlgoUpdate }) {
  const impact = IMPACT_CONFIG[update.impact_level];
  const platformLabel = PLATFORM_LABELS[update.platform] ?? update.platform;
  const platformColor = PLATFORM_COLORS[update.platform] ?? "bg-gray-700 text-white";

  const formattedDate = new Date(update.date_detected).toLocaleDateString(
    "fr-FR",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${platformColor}`}>
          {platformLabel}
        </span>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${impact.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${impact.dot}`} />
          {impact.label}
        </span>
        <span className="text-xs text-gray-400 ml-auto">{formattedDate}</span>
      </div>

      {/* Summary */}
      <p className="text-gray-800 font-medium leading-relaxed mb-3">
        {update.summary}
      </p>

      {/* Action box */}
      {update.action_for_creators && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-3">
          <p className="text-xs font-semibold text-blue-700 mb-0.5">
            ✅ Action recommandée
          </p>
          <p className="text-sm text-blue-800">{update.action_for_creators}</p>
        </div>
      )}

      {/* Affected areas */}
      {update.affected_areas?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {update.affected_areas.map((area) => (
            <span
              key={area}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
            >
              {area.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Source */}
      <a
        href={update.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-400 hover:text-gray-600 underline truncate block"
      >
        Source : {update.source_title}
      </a>
    </article>
  );
}
