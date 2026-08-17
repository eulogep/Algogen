import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeResponse, UserProfile } from "./types";

const client = new Anthropic();

type StrategyResponse = Omit<AnalyzeResponse, "analysis_metadata">;

/**
 * Appelle Claude API avec retry logic + JSON parsing robuste
 */
export async function callClaudeWithRetry(
  systemPrompt: string,
  userMessage: string,
  maxRetries: number = 3
): Promise<StrategyResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        system: systemPrompt,
      });

      // Extraire le contenu texte
      const textContent = message.content.find((b) => b.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      // Parser JSON avec nettoyage (au cas où il y a du markdown)
      const cleanedText = textContent.text
        .replace(/^```json\n?/, "") // Retire ```json du début
        .replace(/\n?```$/, "") // Retire ``` de la fin
        .trim();

      const parsed: StrategyResponse = JSON.parse(cleanedText);

      // Validation minimale de la structure
      validateStrategyResponse(parsed);

      return parsed;
    } catch (error) {
      lastError = error as Error;

      // Si c'est une erreur de crédits, stop immédiatement
      if (
        error instanceof Error &&
        error.message.includes("credit balance is too low")
      ) {
        console.error(
          `❌ Anthropic credits depleted - cannot retry (attempt ${attempt}/${maxRetries})`
        );
        throw new Error(
          "API credits exhausted. Please refill at console.anthropic.com"
        );
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.warn(
          `⚠️ API attempt ${attempt}/${maxRetries} failed. Retrying in ${waitMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  // Tous les retries ont échoué
  console.error(`❌ All ${maxRetries} attempts failed:`, lastError?.message);
  throw new Error(
    `Failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Version streaming de callClaudeWithRetry
 * Utilise Server-Sent Events (SSE) pour envoyer les chunks progressivement
 */
export async function* callClaudeWithRetryStream(
  systemPrompt: string,
  userMessage: string,
  maxRetries: number = 3
): AsyncGenerator<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const stream = await client.messages.stream({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        system: systemPrompt,
      });

      let fullText = "";

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const text = chunk.delta.text;
          fullText += text;
          yield text; // Envoyer chunk par chunk
        }
      }

      // Vérifier validité JSON à la fin
      const cleanedText = fullText
        .replace(/^```json\n?/, "")
        .replace(/\n?```$/, "")
        .trim();

      validateStrategyResponse(JSON.parse(cleanedText));
      return; // Succès, sortir
    } catch (error) {
      lastError = error as Error;

      if (
        error instanceof Error &&
        error.message.includes("credit balance is too low")
      ) {
        throw new Error(
          "API credits exhausted. Please refill at console.anthropic.com"
        );
      }

      if (attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt - 1) * 1000;
        yield `\n⚠️ Retry in ${waitMs}ms...\n`;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Valide que la réponse contient les champs obligatoires
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateStrategyResponse(data: unknown): asserts data is StrategyResponse {
  if (!isRecord(data)) {
    throw new Error("strategy response must be an object");
  }

  const required = [
    "algorithm_summary",
    "potential_score",
    "score_justification",
    "quick_wins",
    "top_5_levers",
    "weekly_plan",
    "content_examples",
    "mistakes_to_avoid",
    "experiments",
  ];

  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validation supplémentaire
  if (typeof data.potential_score !== "number" || data.potential_score < 0 || data.potential_score > 100) {
    throw new Error("potential_score must be a number between 0 and 100");
  }
  if (!Array.isArray(data.quick_wins) || data.quick_wins.length !== 3 || !data.quick_wins.every((item: unknown) => typeof item === "string")) {
    throw new Error("quick_wins must be an array of exactly 3 strings");
  }
  if (!Array.isArray(data.top_5_levers) || !data.top_5_levers.every((item: unknown) => typeof item === "string")) {
    throw new Error("top_5_levers must be an array of strings");
  }
  if (!Array.isArray(data.experiments) || data.experiments.length < 1 || data.experiments.length > 3) {
    throw new Error("experiments must contain between 1 and 3 items");
  }
  for (const experiment of data.experiments) {
    if (!isRecord(experiment)) {
      throw new Error("each experiment must be an object");
    }
    for (const field of ["experiment", "hypothesis", "primary_metric", "test_window", "decision_rule"]) {
      const value = experiment[field];
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`experiment.${field} must be a non-empty string`);
      }
    }
  }
}

/**
 * Fallback strategy (si l'API échoue complètement)
 */
export function generateFallbackStrategy(
  platformName: string,
  userProfile: Pick<UserProfile, "currentFrequency">
): StrategyResponse {
  return {
    algorithm_summary: `Stratégie générique pour ${platformName} basée sur notre knowledge base (IA indisponible).`,
    potential_score: 65,
    score_justification:
      "Score estimé basé sur alignement niche/plateforme sans analyse IA.",
    quick_wins: [
      `Optimiser la fréquence à ${userProfile.currentFrequency} posts/semaine`,
      "Tester 3 formats différents de hooks d'accroche",
      "Analyser les 10 meilleurs posts de votre niche",
    ],
    top_5_levers: [
      "Qualité et régularité du contenu",
      "Engagement et interaction communautaire",
      "Optimisation des thumbnails et captions",
      "Test A/B des formats de contenu",
      "Timing et fréquence de publication",
    ],
    weekly_plan: {
      week1:
        "Semaine d'audit : analysez vos 10 meilleurs posts et identifiez patterns gagnants.",
      week2:
        "Semaine d'expérimentation : testez 2 nouveaux formats de hooks.",
      week3:
        "Semaine d'optimisation : affinez la fréquence et les horaires.",
      week4:
        "Semaine de consolidation : mesurez et documentez les résultats.",
    },
    content_examples: [
      "Hook question + B-roll rapide + CTA en fin (30-60s)",
      "Trend du moment + angle personnel + twist inattendu",
      "Tutoriel court (format 9:16) avec text overlay animé",
      "Story/moment behind-the-scenes + authentique",
      "Collaboration ou duet avec créateur plus grand",
    ],
    mistakes_to_avoid: [
      "Inconsistance dans la fréquence de publication",
      "Ignorer les signaux d'engagement de votre audience",
      "Copier les autres sans adapter à votre niche",
      "Négliger l'optimisation technique (qualité vidéo, sous-titres, etc.)",
      "Changer de stratégie trop souvent sans mesurer les résultats",
    ],
    experiments: [
      {
        experiment: "Comparer deux hooks sur un même format",
        hypothesis: "Un hook plus direct améliore la rétention des premières secondes.",
        primary_metric: "Taux de rétention au début de la vidéo",
        test_window: "6 publications comparables sur 14 jours",
        decision_rule: "Conserver le hook gagnant seulement si l'amélioration est observée sur au moins 3 publications comparables.",
      },
      {
        experiment: "Tester deux créneaux de publication",
        hypothesis: "Le créneau le plus réactif génère davantage de signaux précoces.",
        primary_metric: "Engagement dans les 60 premières minutes",
        test_window: "8 publications réparties sur 2 semaines",
        decision_rule: "Adopter le créneau qui améliore la médiane des interactions précoces, à contenu comparable.",
      },
    ],
  };
}

export type { StrategyResponse };
