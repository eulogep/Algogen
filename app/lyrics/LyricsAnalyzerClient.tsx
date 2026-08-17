"use client";

import { FormEvent, useState } from "react";

type LexicalTerm = {
  term: string;
  score: number;
  z_score: number;
  love_document_coverage: number;
  baseline_document_coverage: number;
  is_love_anchor: boolean;
};

type TermAssociation = {
  left: string;
  right: string;
  pmi: number;
  love_document_count: number;
};

type AnalysisResponse = {
  methodology: {
    data_mode: string;
    labeling_method: string;
    statistic: string;
    term_cap_per_song: number;
    source: { name: string; version?: string; source_url?: string; terms_are_stemmed?: boolean };
  };
  diagnostics: {
    submitted_documents: number;
    total_documents: number;
    love_documents: number;
    baseline_documents: number;
    vocabulary_size: number;
    effective_love_weight: number;
    effective_baseline_weight: number;
  };
  validation: {
    mode: "not_applied" | "auto_for_exploratory";
    exploratory_love_candidates: number;
    retained_exploratory_love_labels: number;
    rejected_exploratory_love_labels: number;
    minimum_evidence_families: number;
  };
  love_anchors: string[];
  salient_terms: LexicalTerm[];
  optimized_palette: LexicalTerm[];
  associations: TermAssociation[];
  warnings: string[];
  generated_at: string;
  data_retention: string;
};

const EDITORIAL_SAMPLE = `{
  "dataset": {
    "name": "Mon corpus agrégé",
    "source_url": "https://…",
    "terms_are_stemmed": false
  },
  "songs": [
    {
      "id": "song-001",
      "year": 1994,
      "language": "fr",
      "stratum": "1990s:fr",
      "isLove": true,
      "counts": { "amour": 2, "coeur": 1, "nuit": 1 }
    }
  ]
}`;

function scoreColor(score: number): string {
  if (score >= 4) return "#4ade80";
  if (score >= 2) return "#fbbf24";
  return "#a1a1aa";
}

export default function LyricsAnalyzerClient() {
  const [payload, setPayload] = useState(EDITORIAL_SAMPLE);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formattedGeneratedAt = analysis?.generated_at
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(analysis.generated_at))
    : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAnalysis(null);

    let body: unknown;
    try {
      body = JSON.parse(payload);
    } catch {
      setError("Le document doit être un JSON valide contenant un dataset et des comptes de mots agrégés.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/lyrics/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as AnalysisResponse & { error?: string };
      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Analyse impossible");
      }
      setAnalysis(result);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Analyse impossible");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa", padding: "112px 20px 72px" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <header style={{ maxWidth: "760px", marginBottom: "32px" }}>
          <p style={{ color: "#4ade80", fontFamily: "monospace", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
            Laboratoire lexical · données agrégées
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.045em", margin: 0 }}>
            Tendances des chansons <span style={{ color: "#4ade80" }}>d&apos;amour</span>, sans paroles complètes.
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "1rem", lineHeight: 1.7, marginTop: "18px" }}>
            Importez uniquement des comptes de termes par chanson. AlgoLens équilibre les périodes, plafonne les répétitions et compare le corpus romantique à un corpus témoin pour isoler les mots réellement distinctifs.
          </p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "20px" }}>
          <form onSubmit={handleSubmit} style={{ border: "1px solid #27272a", borderRadius: "16px", background: "#111113", padding: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "14px" }}>
              <div>
                <h2 style={{ fontSize: "1rem", margin: 0 }}>Importer un corpus agrégé</h2>
                <p style={{ color: "#71717a", fontSize: "0.82rem", margin: "7px 0 0", lineHeight: 1.5 }}>Format JSON : métadonnées du dataset, `songs[]`, puis `counts` par terme.</p>
              </div>
              <span style={{ border: "1px solid rgba(74,222,128,0.3)", borderRadius: "999px", background: "rgba(74,222,128,0.08)", color: "#86efac", padding: "5px 9px", fontSize: "0.72rem" }}>Aucune rétention de données</span>
            </div>
            <textarea
              aria-label="Corpus agrégé au format JSON"
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              spellCheck={false}
              style={{ width: "100%", minHeight: "300px", boxSizing: "border-box", resize: "vertical", border: "1px solid #3f3f46", borderRadius: "10px", background: "#09090b", color: "#d4d4d8", padding: "14px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.78rem", lineHeight: 1.55 }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginTop: "14px" }}>
              <p style={{ color: "#fbbf24", fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>Ne collez pas de paroles, couplets, refrains ni texte brut : la route les refuse explicitement.</p>
              <button disabled={isLoading} type="submit" style={{ border: 0, borderRadius: "9px", padding: "11px 16px", background: isLoading ? "#3f3f46" : "#4ade80", color: "#09090b", cursor: isLoading ? "wait" : "pointer", fontWeight: 700 }}>
                {isLoading ? "Analyse en cours…" : "Analyser le corpus"}
              </button>
            </div>
            {error && <p role="alert" style={{ color: "#fca5a5", margin: "14px 0 0", fontSize: "0.85rem" }}>{error}</p>}
          </form>

          {analysis && (
            <section style={{ display: "grid", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                {[
                  ["Soumis", analysis.diagnostics.submitted_documents],
                  ["Retenus", analysis.diagnostics.total_documents],
                  ["Amour", analysis.diagnostics.love_documents],
                  ["Témoin", analysis.diagnostics.baseline_documents],
                  ["Vocabulaire", analysis.diagnostics.vocabulary_size],
                ].map(([label, value]) => (
                  <div key={String(label)} style={{ border: "1px solid #27272a", borderRadius: "12px", background: "#111113", padding: "16px" }}>
                    <p style={{ color: "#71717a", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
                    <p style={{ color: "#fafafa", fontSize: "1.7rem", fontWeight: 800, margin: "7px 0 0" }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                <ResultCard title="Palette optimisée" subtitle="Mots saillants, équilibrés par strate et support documentaire">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {analysis.optimized_palette.map((term) => (
                      <span key={term.term} title={`z-score ${term.z_score.toFixed(2)}`} style={{ border: `1px solid ${scoreColor(term.score)}55`, color: scoreColor(term.score), borderRadius: "999px", padding: "7px 10px", background: `${scoreColor(term.score)}12`, fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                        {term.term}
                      </span>
                    ))}
                  </div>
                </ResultCard>

                <ResultCard title="Associations au niveau chanson" subtitle="Cooccurrences statistiques, sans restituer de séquences de paroles">
                  <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                    {analysis.associations.slice(0, 8).map((association) => (
                      <div key={`${association.left}-${association.right}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px", color: "#d4d4d8", fontSize: "0.84rem" }}>
                        <span>{association.left} <span style={{ color: "#52525b" }}>↔</span> {association.right}</span>
                        <span style={{ color: "#71717a" }}>{association.love_document_count} docs · PMI {association.pmi.toFixed(2)}</span>
                      </div>
                    ))}
                    {analysis.associations.length === 0 && <p style={{ color: "#71717a", fontSize: "0.84rem", margin: 0 }}>Aucune association assez soutenue dans cet échantillon.</p>}
                  </div>
                </ResultCard>

                <ResultCard title="Validation des labels exploratoires" subtitle="Contrôle automatique conservateur avant l’analyse">
                  {analysis.validation.mode === "auto_for_exploratory" ? (
                    <p style={{ color: "#d4d4d8", lineHeight: 1.65, fontSize: "0.84rem", margin: 0 }}>
                      {analysis.validation.retained_exploratory_love_labels} candidat(s) retenu(s) sur {analysis.validation.exploratory_love_candidates} ; {analysis.validation.rejected_exploratory_love_labels} écarté(s). Chaque candidat retenu présente au moins {analysis.validation.minimum_evidence_families} familles d’indices convergents.
                    </p>
                  ) : (
                    <p style={{ color: "#71717a", lineHeight: 1.65, fontSize: "0.84rem", margin: 0 }}>Aucune validation exploratoire automatique n’a été appliquée à ce corpus.</p>
                  )}
                </ResultCard>
              </div>

              <ResultCard title="Méthode et limites" subtitle={`Généré le ${formattedGeneratedAt ?? "—"} · rétention ${analysis.data_retention}`}>
                <p style={{ color: "#a1a1aa", lineHeight: 1.6, fontSize: "0.84rem", marginTop: 0 }}>{analysis.methodology.statistic}</p>
                <p style={{ color: "#71717a", fontSize: "0.79rem" }}>Source : {analysis.methodology.source.name}{analysis.methodology.source.version ? ` · ${analysis.methodology.source.version}` : ""} · étiquetage : {analysis.methodology.labeling_method}</p>
                <ul style={{ color: "#a1a1aa", fontSize: "0.8rem", lineHeight: 1.55, paddingLeft: "18px", marginBottom: 0 }}>
                  {analysis.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </ResultCard>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function ResultCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #27272a", borderRadius: "16px", background: "#111113", padding: "22px" }}>
      <h2 style={{ fontSize: "1rem", margin: 0 }}>{title}</h2>
      <p style={{ color: "#71717a", fontSize: "0.78rem", lineHeight: 1.45, margin: "7px 0 16px" }}>{subtitle}</p>
      {children}
    </div>
  );
}
