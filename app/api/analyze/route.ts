import { NextRequest, NextResponse } from "next/server";
import { getPlatformData } from "@/lib/algorithms";
import { getSessionUser, getUserPlan, checkAnalysisLimit } from "@/lib/plans";
import type { AnalyzeRequest, AnalyzeResponse, UserProfile } from "@/lib/types";
import { callClaudeWithRetry, generateFallbackStrategy } from "@/lib/anthropic";
import { generateCacheKey, getCache, setCache } from "@/lib/cache";
import { withRateLimit } from "@/lib/rate-limit";
import { logAnalytics } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

async function persistAnalysis(
  userId: string,
  platform: AnalyzeRequest["platform"],
  userProfile: UserProfile,
  strategy: AnalyzeResponse
): Promise<void> {
  const supabase = await createClient();
  const [historyResult, strategyResult] = await Promise.all([
    supabase.from("analysis_history").insert({
      user_id: userId,
      platform_id: platform,
      niche: userProfile.niche,
      objective: userProfile.objective,
      level: userProfile.level,
      score: strategy.potential_score,
      strategy,
    }),
    supabase.from("strategies").insert({
      user_id: userId,
      platform,
      profile: userProfile,
      strategy,
    }),
  ]);

  if (historyResult.error) {
    console.error("Failed to save analysis history:", historyResult.error);
  }
  if (strategyResult.error) {
    console.error("Failed to save strategy:", strategyResult.error);
  }
}

async function analyzeHandler(request: NextRequest) {
  try {
    const body: AnalyzeRequest & { compareMode?: boolean } = await request.json();
    const { platform, userProfile, compareMode } = body;

    if (!platform || !userProfile) {
      return NextResponse.json(
        { error: "platform and userProfile are required" },
        { status: 400 }
      );
    }

    // ── Gating par plan ─────────────────────────────────────────────────
    const user = await getSessionUser();

    if (user) {
      const { plan } = await getUserPlan(user.id);

      // Compare mode réservé Pro/Student
      if (compareMode && plan === "free") {
        return NextResponse.json(
          { error: "UPGRADE_REQUIRED", feature: "compare", plan: "free" },
          { status: 403 }
        );
      }

      // Limite 3 analyses/mois pour Free
      if (plan === "free") {
        const { allowed, used, limit } = await checkAnalysisLimit(user.id);
        if (!allowed) {
          return NextResponse.json(
            { error: "UPGRADE_REQUIRED", feature: "analysis_limit", used, limit, plan: "free" },
            { status: 403 }
          );
        }
      }
    }
    // Note : utilisateurs non connectés peuvent analyser librement (localStorage only)

    const startTime = Date.now();
    // 1️⃣ VÉRIFIER LE CACHE HYBRIDE (L1 / L2)
    const cacheKey = generateCacheKey(userProfile, platform);
    const cachedStrategy = await getCache(cacheKey, platform); // ← await !

    if (cachedStrategy) {
      logAnalytics({ type: "cache_hit", platform, responseTimeMs: Date.now() - startTime, source: "cache" });
      if (user) {
        await persistAnalysis(user.id, platform, userProfile, cachedStrategy);
      }
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        ...cachedStrategy,
        source: "cache",
        responseTimeMs: responseTime,
        servedAt: new Date().toISOString(),
      });
    }

    const platformData = getPlatformData(platform);
    if (!platformData) {
      return NextResponse.json(
        { error: `Unknown platform: ${platform}` },
        { status: 404 }
      );
    }

    const platformContext = JSON.stringify(platformData, null, 2);

    const systemPrompt = `Expert algo ${platformData.platform}${platformData.content_type ? ` (${platformData.content_type})` : ''}.
Analyse ce contexte algorithmique et génère une stratégie d'alignement personnalisée.

Données algo (source fiable) :
\`\`\`json
${platformContext}
\`\`\`

Règles score: 0-39 (faible adéquation), 40-69 (moyen), 70-100 (fort).
Base le score sur: alignement niche/formats, niveau creator vs complexité algo, fréquence actuelle vs optimale.

Réponse OBLIGATOIRE: JSON valide, structure exacte ci-dessous, AUCUN texte avant/après.

Exemple structure (remplace les valeurs):
{
  "algorithm_summary": "Comment fonctionne cet algo en 2-3 phrases pour ce creator",
  "potential_score": 72,
  "score_justification": "Une phrase d'explication du score",
  "quick_wins": ["Action concrète 48h (format/résultat)", "Action 2", "Action 3"],
  "top_5_levers": ["Levier 1 (actionnable)", "Levier 2", "Levier 3", "Levier 4", "Levier 5"],
  "weekly_plan": {
    "week1": "Objectif semaine 1 + types posts + fréquence + hooks à tester",
    "week2": "Objectif semaine 2 + actions",
    "week3": "Objectif semaine 3 + pivots",
    "week4": "Objectif semaine 4 + consolidation"
  },
  "content_examples": [
    "Exemple 1 (format spécifique + hook accrocheur + angle)",
    "Exemple 2", "Exemple 3", "Exemple 4", "Exemple 5"
  ],
  "mistakes_to_avoid": ["Erreur critique 1", "Erreur 2", "Erreur 3", "Erreur 4", "Erreur 5"]
}`;

    const userMessage = JSON.stringify({
      profil_creator: {
        niche: userProfile.niche,
        type_contenu: userProfile.contentType,
        audience_cible: userProfile.targetAudience,
        objectif: userProfile.objective,
        frequence_actuelle: userProfile.currentFrequency,
        niveau: userProfile.level,
      },
      plateforme: platformData.platform,
      demande: "Génère ma stratégie d'alignement algo personnalisée",
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    let strategy: AnalyzeResponse;
    let strategySource: "api" | "fallback" = "api";
    try {
      strategy = await callClaudeWithRetry(systemPrompt, userMessage) as AnalyzeResponse;
      logAnalytics({ type: "api_success", platform, responseTimeMs: Date.now() - startTime, source: "api" });
    } catch (apiError: any) {
      console.error("Claude API failed after retries, using fallback:", apiError.message);
      // Utilisation du fallback en cas d'échec total (ex: plus de crédits)
      strategy = generateFallbackStrategy(platformData.platform, userProfile) as AnalyzeResponse;
      strategySource = "fallback";
      logAnalytics({ type: "api_failed_with_fallback", platform, responseTimeMs: Date.now() - startTime, source: "fallback", errorMessage: apiError.message });
    }

    // 2️⃣ SAUVEGARDER EN CACHE (Hybride L1+L2) APRÈS SUCCÈS
    if (strategy) {
      await setCache(cacheKey, platformData.platform, strategy);
    }

    // 3️⃣ SAUVEGARDER L'HISTORIQUE ET LA STRATÉGIE LIÉS À L'UTILISATEUR
    const currentUser = await getSessionUser();
    if (currentUser && strategySource !== "fallback") {
      await persistAnalysis(currentUser.id, platform, userProfile, strategy);
    }

    const responseTime = Date.now() - startTime;
    return NextResponse.json({
      ...strategy,
      source: strategySource,
      responseTimeMs: responseTime,
      servedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Analyze route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limit : 5 requêtes par minute
  return withRateLimit(request, analyzeHandler, { maxRequests: 5, windowMs: 60 * 1000 });
}
