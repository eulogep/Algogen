import type {
  AlgorithmData,
  AnalysisMetadata,
  KnowledgeBaseMetadata,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function ageInDays(lastUpdated: string): number | null {
  const timestamp = Date.parse(`${lastUpdated}T00:00:00.000Z`);
  if (Number.isNaN(timestamp)) return null;

  return Math.max(0, Math.floor((Date.now() - timestamp) / DAY_MS));
}

function confidenceFromAge(days: number | null): AnalysisMetadata["confidence"] {
  if (days === null) return "low";
  if (days <= 90) return "high";
  if (days <= 365) return "medium";
  return "low";
}

/**
 * Construit des métadonnées de provenance indépendantes du modèle de langage.
 * Elles empêchent l'interface de présenter une base de connaissances statique
 * comme une observation en temps réel des plateformes.
 */
export function buildAnalysisMetadata(
  platformData: AlgorithmData,
  knowledgeBase: KnowledgeBaseMetadata,
  mode: AnalysisMetadata["data_mode"] = "static_editorial_context"
): AnalysisMetadata {
  const ageDays = ageInDays(knowledgeBase.last_updated);
  const confidence = mode === "fallback" ? "low" : confidenceFromAge(ageDays);
  const limitations = [
    "Cette stratégie s'appuie sur une base éditoriale versionnée ; elle ne mesure pas les performances de votre compte ni les signaux internes de la plateforme.",
    "Chaque recommandation doit être testée sur votre propre contenu avant d'être généralisée.",
  ];

  if (ageDays === null) {
    limitations.push("La date de mise à jour de la base est inconnue : le niveau de confiance est réduit.");
  } else if (ageDays > 365) {
    limitations.push(`La base a été mise à jour il y a ${ageDays} jours : vérifiez les sources officielles avant toute décision importante.`);
  }

  if (mode === "fallback") {
    limitations.push("La réponse a été générée par le plan de continuité local, sans appel au modèle de langage.");
  }

  return {
    data_mode: mode,
    knowledge_base: knowledgeBase,
    assessed_at: new Date().toISOString(),
    confidence,
    source_urls: Array.from(new Set(platformData.sources)).filter((source) => source.startsWith("http")),
    limitations,
  };
}
