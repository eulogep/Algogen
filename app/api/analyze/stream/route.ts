import { NextRequest, NextResponse } from "next/server";
import { getPlatformData } from "@/lib/algorithms";
import { getSessionUser, getUserPlan, checkAnalysisLimit } from "@/lib/plans";
import type { AnalyzeRequest } from "@/lib/types";
import { callClaudeWithRetryStream } from "@/lib/anthropic";
import { withRateLimit } from "@/lib/rate-limit";

async function streamHandler(request: NextRequest) {
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

      if (compareMode && plan === "free") {
        return NextResponse.json(
          { error: "UPGRADE_REQUIRED", feature: "compare", plan: "free" },
          { status: 403 }
        );
      }

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

    const encoder = new TextEncoder();
    const generator = callClaudeWithRetryStream(systemPrompt, userMessage);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            // Encode as pure server-sent events or raw string chunks
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (e: any) {
          controller.enqueue(encoder.encode(`\n\n[ERROR]: ${e.message}`));
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Analyze stream routing error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limit : 5 requêtes par minute
  return withRateLimit(request, streamHandler, { maxRequests: 5, windowMs: 60 * 1000 });
}
