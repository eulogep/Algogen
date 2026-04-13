/**
 * algo-analyzer.ts
 * Analyse les articles scrapés avec Claude pour détecter les vrais changements d'algo
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedArticle } from "./scraper";

const client = new Anthropic();

export type ImpactLevel = "low" | "medium" | "high";

export interface AlgoUpdate {
  platform: string;
  has_update: boolean;
  summary: string;
  impact_level: ImpactLevel;
  affected_areas: string[];
  action_for_creators: string;
  date_detected: string;
  source_url: string;
  source_title: string;
}

const SYSTEM_PROMPT = `Tu es un expert en algorithmes de réseaux sociaux. 
Tu analyses des articles de blogs officiels pour détecter les vrais changements d'algorithme.
Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires.`;

const buildAnalysisPrompt = (article: ScrapedArticle): string => `
Analyse cet article de blog et détermine s'il contient un vrai changement d'algorithme.

Plateforme : ${article.platform}
Titre : ${article.title}
Contenu : ${article.content}

Réponds UNIQUEMENT avec ce JSON (rien d'autre) :
{
  "platform": "${article.platform}",
  "has_update": true ou false,
  "summary": "Résumé en 1-2 phrases du changement (ou 'Aucun changement détecté')",
  "impact_level": "low" | "medium" | "high",
  "affected_areas": ["ranking_signals", "favored_behaviors", "content_format", "posting_frequency", "engagement_signals", "monetization"],
  "action_for_creators": "Conseil actionnable concret pour les créateurs (ou '' si has_update = false)",
  "date_detected": "${new Date().toISOString().split("T")[0]}"
}

Règles :
- has_update = true SEULEMENT si c'est un vrai changement d'algo (pas un article générique)
- impact_level "high" = changement majeur de ranking, "medium" = nouveaux signaux, "low" = ajustement mineur
- affected_areas = tableau des domaines impactés parmi les valeurs ci-dessus
- Si has_update = false, mettre impact_level "low" et affected_areas []
`;

/**
 * Analyse un article avec Claude
 */
export async function analyzeUpdateWithClaude(
  article: ScrapedArticle
): Promise<AlgoUpdate | null> {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildAnalysisPrompt(article) }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const parsed = JSON.parse(rawText.trim()) as AlgoUpdate;

    return {
      ...parsed,
      source_url: article.url,
      source_title: article.title,
    };
  } catch (err) {
    console.error(`[algo-analyzer] Erreur analyse "${article.title}":`, err);
    return null;
  }
}

/**
 * Analyse une liste d'articles en parallèle (avec rate limiting basique)
 */
export async function analyzeArticlesBatch(
  articles: ScrapedArticle[],
  concurrency = 3
): Promise<AlgoUpdate[]> {
  const updates: AlgoUpdate[] = [];

  // Traiter par chunks pour éviter de saturer l'API
  for (let i = 0; i < articles.length; i += concurrency) {
    const chunk = articles.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map((a) => analyzeUpdateWithClaude(a))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value?.has_update) {
        updates.push(result.value);
      }
    }

    // Petite pause entre chunks
    if (i + concurrency < articles.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(
    `[algo-analyzer] ${updates.length} vraies mises à jour sur ${articles.length} articles analysés`
  );
  return updates;
}
