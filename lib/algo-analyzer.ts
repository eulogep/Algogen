/**
 * algo-analyzer.ts
 * Analyse les articles scrapés avec Claude pour détecter les vrais changements d'algo.
 * Les scores de confiance et la provenance sont calculés côté application, pas
 * délégués au modèle de langage.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedArticle } from "./scraper";
import type { SignalPlatform, TrendEvidence } from "./observatory/types";

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
  confidence: number;
  evidenceCount: number;
  sourceType: "official_newsroom";
  affectedFormats: string[];
  affectedCreators: string[];
  evidence: TrendEvidence[];
}

interface ModelUpdate {
  has_update?: boolean;
  summary?: string;
  impact_level?: ImpactLevel;
  affected_areas?: string[];
  action_for_creators?: string;
  affected_formats?: string[];
  affected_creators?: string[];
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
  "has_update": true ou false,
  "summary": "Résumé en 1-2 phrases du changement (ou 'Aucun changement détecté')",
  "impact_level": "low" | "medium" | "high",
  "affected_areas": ["ranking_signals", "favored_behaviors", "content_format", "posting_frequency", "engagement_signals", "monetization"],
  "affected_formats": ["short_video", "long_video", "reel", "post", "live", "story"],
  "affected_creators": ["description concise du segment concerné"],
  "action_for_creators": "Conseil actionnable concret pour les créateurs (ou '' si has_update = false)"
}

Règles :
- has_update = true SEULEMENT si c'est un vrai changement d'algo (pas un article générique)
- impact_level "high" = changement majeur de ranking, "medium" = nouveaux signaux, "low" = ajustement mineur
- affected_areas = tableau des domaines impactés parmi les valeurs ci-dessus
- affected_formats = formats explicitement concernés ; [] si le texte ne le permet pas
- affected_creators = publics ou créateurs explicitement concernés ; [] si le texte ne le permet pas
- Si has_update = false, mettre impact_level "low" et tous les tableaux à []
`;

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asImpactLevel(value: unknown): ImpactLevel {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function sourcePlatform(platform: string): SignalPlatform {
  const map: Record<string, SignalPlatform> = {
    tiktok: "tiktok",
    instagram_reels: "instagram",
    instagram_feed: "instagram",
    youtube_shorts: "youtube",
    youtube_longform: "youtube",
    linkedin: "linkedin",
    twitter: "x_twitter",
  };
  return map[platform] ?? "web";
}

function buildEvidence(article: ScrapedArticle): TrendEvidence[] {
  return [
    {
      id: `official:${article.platform}:${article.url}:${article.title}`,
      platform: sourcePlatform(article.platform),
      sourceType: "official_newsroom",
      url: article.url,
      title: article.title,
      detectedAt: article.scrapedAt,
    },
  ];
}

/**
 * Analyse un article avec Claude. Les attributs de preuve sont ensuite ajoutés
 * de manière déterministe à partir de la source réellement collectée.
 */
export async function analyzeUpdateWithClaude(
  article: ScrapedArticle
): Promise<AlgoUpdate | null> {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 640,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildAnalysisPrompt(article) }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(rawText.trim()) as ModelUpdate;
    const hasUpdate = parsed.has_update === true;

    return {
      platform: article.platform,
      has_update: hasUpdate,
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : "Aucun changement détecté",
      impact_level: hasUpdate ? asImpactLevel(parsed.impact_level) : "low",
      affected_areas: hasUpdate ? asStringArray(parsed.affected_areas) : [],
      action_for_creators:
        hasUpdate && typeof parsed.action_for_creators === "string"
          ? parsed.action_for_creators.trim()
          : "",
      date_detected: new Date().toISOString().split("T")[0],
      source_url: article.url,
      source_title: article.title,
      confidence: 60,
      evidenceCount: 1,
      sourceType: "official_newsroom",
      affectedFormats: hasUpdate ? asStringArray(parsed.affected_formats) : [],
      affectedCreators: hasUpdate ? asStringArray(parsed.affected_creators) : [],
      evidence: buildEvidence(article),
    };
  } catch (err) {
    console.error(`[algo-analyzer] Erreur analyse "${article.title}":`, err);
    return null;
  }
}

/**
 * Analyse une liste d'articles en parallèle (avec rate limiting basique).
 */
export async function analyzeArticlesBatch(
  articles: ScrapedArticle[],
  concurrency = 3
): Promise<AlgoUpdate[]> {
  const updates: AlgoUpdate[] = [];

  for (let index = 0; index < articles.length; index += concurrency) {
    const chunk = articles.slice(index, index + concurrency);
    const results = await Promise.allSettled(
      chunk.map((article) => analyzeUpdateWithClaude(article))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value?.has_update) {
        updates.push(result.value);
      }
    }

    if (index + concurrency < articles.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(
    `[algo-analyzer] ${updates.length} vraies mises à jour sur ${articles.length} articles analysés`
  );
  return updates;
}
