"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORMS } from "@/lib/platforms";
import type { PlatformId, UserProfile, AnalyzeResponse } from "@/lib/types";

const CONTENT_TYPES = [
  { value: "educational", label: "🎓 Éducatif" },
  { value: "entertainment", label: "🎭 Divertissement" },
  { value: "sales", label: "🛒 Vente / Produit" },
  { value: "personal_branding", label: "✨ Personal Branding" },
  { value: "news", label: "📰 Actualités" },
  { value: "lifestyle", label: "🌿 Lifestyle" },
  { value: "other", label: "🔮 Autre" },
];

const OBJECTIVES = [
  { value: "visibility", label: "🚀 Visibilité / Portée" },
  { value: "subscribers", label: "👥 Abonnés" },
  { value: "sales", label: "💰 Ventes" },
  { value: "engagement", label: "💬 Engagement" },
  { value: "brand_awareness", label: "🌐 Notoriété de marque" },
];

const LEVELS = [
  { value: "beginner", label: "🌱 Débutant (0-1k)" },
  { value: "intermediate", label: "📈 Intermédiaire (1k-50k)" },
  { value: "advanced", label: "🔥 Avancé (50k+)" },
];

function getScoreColor(score: number) {
  if (score >= 70) return "#4ade80";
  if (score >= 40) return "#fbbf24";
  return "#f87171";
}

function ScoreMini({ score }: { score: number }) {
  const color = getScoreColor(score);
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
      <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="36" y="40" textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="Inter, sans-serif">{score}</text>
    </svg>
  );
}

type Step = "select" | "profile" | "results";

interface CompareResult {
  [platformId: string]: AnalyzeResponse;
}

async function analyzeForComparison(
  platform: PlatformId,
  userProfile: UserProfile
): Promise<AnalyzeResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, userProfile, compareMode: true }),
  });

  const payload = await response.json() as AnalyzeResponse & {
    error?: string;
    feature?: string;
  };

  if (!response.ok) {
    if (payload.error === "UPGRADE_REQUIRED" && payload.feature === "compare") {
      throw new Error("Le mode comparaison est réservé aux abonnements Pro et Étudiant.");
    }
    throw new Error(payload.error ?? "Erreur lors de l'analyse des plateformes.");
  }

  return payload;
}

export default function ComparePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<PlatformId[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    niche: "", contentType: "educational", targetAudience: "",
    objective: "visibility", currentFrequency: "", level: "beginner",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CompareResult | null>(null);

  const togglePlatform = (id: PlatformId) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return [prev[1], id]; // replace oldest
      return [...prev, id];
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.niche || !profile.targetAudience || !profile.currentFrequency) {
      setError("Merci de remplir tous les champs."); return;
    }
    setLoading(true); setError(null);
    try {
      const [resA, resB] = await Promise.all(
        selected.map((platform) => analyzeForComparison(platform, profile))
      );
      setResults({ [selected[0]]: resA, [selected[1]]: resB });
      setStep("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", padding: "40px 20px 80px", position: "relative", zIndex: 1 }}>
      {/* BG orb */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: "36px" }}>
          <button className="btn-secondary" onClick={() => step === "select" ? router.push("/") : setStep("select")} style={{ marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            ← {step === "select" ? "Retour" : "Changer de plateformes"}
          </button>
          <span className="badge badge-purple" style={{ marginBottom: "12px", display: "inline-flex" }}>⚖️ Mode Comparaison</span>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "8px" }}>
            Quelle plateforme est <span className="gradient-text">la plus adaptée</span> à ton profil ?
          </h1>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            {step === "select" ? "Sélectionne 2 plateformes à comparer, puis décris ton profil."
              : step === "profile" ? "Un seul profil pour les deux analyses — Claude s'occupe du reste."
              : "Résultats comparatifs côte à côte."}
          </p>
        </div>

        {/* ── STEP 1: Select ─────────────────────────────────── */}
        {step === "select" && (
          <div className="fade-up fade-up-delay-1">
            <p className="section-label" style={{ marginBottom: "20px" }}>
              Choisis 2 plateformes {selected.length > 0 && `(${selected.length}/2 sélectionnée${selected.length > 1 ? "s" : ""})`}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px", marginBottom: "28px" }}>
              {PLATFORMS.map((p) => {
                const isSelected = selected.includes(p.id);
                const idx = selected.indexOf(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    style={{
                      background: isSelected ? `${p.color}14` : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${isSelected ? p.color : "rgba(255,255,255,0.08)"}`,
                      borderRadius: "14px", padding: "18px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "14px",
                      textAlign: "left", transition: "all 0.2s",
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: "absolute", top: "8px", right: "8px",
                        width: "22px", height: "22px", borderRadius: "50%",
                        background: p.color, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "white",
                      }}>{idx + 1}</div>
                    )}
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${p.color}18`, border: `1px solid ${p.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{p.icon}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", color: isSelected ? "white" : "var(--text)", marginBottom: "2px" }}>{p.label}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.shortDescription}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              className="btn-primary"
              disabled={selected.length < 2}
              onClick={() => setStep("profile")}
              style={{ opacity: selected.length < 2 ? 0.4 : 1, cursor: selected.length < 2 ? "not-allowed" : "pointer" }}
            >
              Continuer avec {selected.length === 2 ? `${PLATFORMS.find(p => p.id === selected[0])?.label} vs ${PLATFORMS.find(p => p.id === selected[1])?.label}` : "2 plateformes"} →
            </button>
          </div>
        )}

        {/* ── STEP 2: Profile ────────────────────────────────── */}
        {step === "profile" && (
          <form onSubmit={handleAnalyze} className="fade-up">
            {/* Selected platforms pills */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
              {selected.map((id) => {
                const p = PLATFORMS.find((pl) => pl.id === id)!;
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "99px", background: `${p.color}14`, border: `1px solid ${p.color}30` }}>
                    <span>{p.icon}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: p.color }}>{p.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="glass" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "22px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Niche / Secteur *</label>
                <input className="input" placeholder="Ex: Développement personnel, Finance, Cuisine végane..." value={profile.niche} onChange={(e) => setProfile({ ...profile, niche: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Type de contenu *</label>
                <select className="select" value={profile.contentType} onChange={(e) => setProfile({ ...profile, contentType: e.target.value as UserProfile["contentType"] })}>
                  {CONTENT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Audience cible *</label>
                <input className="input" placeholder="Ex: 25-35 ans, entrepreneurs, intéressés par la productivité..." value={profile.targetAudience} onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Objectif *</label>
                  <select className="select" value={profile.objective} onChange={(e) => setProfile({ ...profile, objective: e.target.value as UserProfile["objective"] })}>
                    {OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Fréquence actuelle *</label>
                  <input className="input" placeholder="Ex: 3 posts/semaine..." value={profile.currentFrequency} onChange={(e) => setProfile({ ...profile, currentFrequency: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "10px" }}>Niveau</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {LEVELS.map((l) => (
                    <label key={l.value} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", flex: 1, minWidth: "140px", background: profile.level === l.value ? "rgba(124,58,237,0.12)" : "var(--surface-2)", border: `1px solid ${profile.level === l.value ? "rgba(124,58,237,0.4)" : "var(--border)"}`, transition: "all 0.2s" }}>
                      <input type="radio" name="level" value={l.value} checked={profile.level === l.value} onChange={() => setProfile({ ...profile, level: l.value as UserProfile["level"] })} style={{ accentColor: "#7c3aed" }} />
                      <span style={{ fontSize: "0.85rem" }}>{l.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: "0.88rem" }}>⚠️ {error}</div>}

              <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: "1rem", padding: "16px", opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                    <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                    Analyse de 2 plateformes en parallèle...
                  </span>
                ) : "⚖️ Comparer les 2 plateformes"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Results side-by-side ───────────────────── */}
        {step === "results" && results && (
          <div className="fade-up">
            {/* Which won? */}
            {(() => {
              const [idA, idB] = selected;
              const scoreA = results[idA]?.potential_score ?? 0;
              const scoreB = results[idB]?.potential_score ?? 0;
              const winnerId = scoreA >= scoreB ? idA : scoreB > scoreA ? idB : null;
              const winner = winnerId ? PLATFORMS.find((p) => p.id === winnerId) : null;
              const isDraw = scoreA === scoreB;

              return (
                <div className="glass" style={{ padding: "20px 24px", marginBottom: "24px", textAlign: "center", background: winner ? `${winner.color}0a` : undefined, borderColor: winner ? `${winner.color}25` : undefined }}>
                  {isDraw ? (
                    <p style={{ fontSize: "1rem", fontWeight: 600 }}>🤝 Égalité parfaite — les deux plateformes sont aussi adaptées.</p>
                  ) : (
                    <p style={{ fontSize: "1rem", fontWeight: 600 }}>
                      {winner?.icon} <strong style={{ color: winner?.color }}>{winner?.label}</strong> est <strong>mieux adapté</strong> à ton profil avec un score de <strong style={{ color: winner?.color }}>{scoreA >= scoreB ? scoreA : scoreB}/100</strong> vs {scoreA < scoreB ? scoreA : scoreB}/100
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Two columns */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "20px" }}>
              {selected.map((platformId) => {
                const strategy = results[platformId];
                const p = PLATFORMS.find((pl) => pl.id === platformId)!;
                const scoreColor = getScoreColor(strategy.potential_score ?? 0);

                return (
                  <div key={platformId} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {/* Platform header */}
                    <div className="glass" style={{ padding: "18px 20px", borderColor: `${p.color}25`, background: `${p.color}06` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "1.5rem" }}>{p.icon}</span>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: "1rem" }}>{p.label}</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.shortDescription}</p>
                          </div>
                        </div>
                        <ScoreMini score={strategy.potential_score ?? 0} />
                      </div>
                      <p style={{ fontSize: "0.75rem", lineHeight: 1.6, color: "var(--text-muted)", fontStyle: "italic" }}>{strategy.score_justification}</p>
                    </div>

                    {/* Quick Wins */}
                    <div className="glass" style={{ padding: "18px 20px" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fbbf24", marginBottom: "12px" }}>⚡ Quick Wins — 48h</p>
                      {(strategy.quick_wins ?? []).map((win, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < 2 ? "8px" : 0, alignItems: "flex-start" }}>
                          <span style={{ color: scoreColor, fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>{i + 1}.</span>
                          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{win}</span>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="glass" style={{ padding: "18px 20px" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>🔍 Résumé algorithme</p>
                      <p style={{ fontSize: "0.82rem", lineHeight: 1.7, color: "var(--text-muted)" }}>{strategy.algorithm_summary}</p>
                    </div>

                    {/* Top Levers */}
                    <div className="glass" style={{ padding: "18px 20px" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: p.color, marginBottom: "12px" }}>🎯 Top leviers</p>
                      {strategy.top_5_levers.slice(0, 3).map((lever, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < 2 ? "8px" : 0, alignItems: "flex-start" }}>
                          <span style={{ color: p.color, fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>{i + 1}.</span>
                          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{lever}</span>
                        </div>
                      ))}
                    </div>

                    {/* Full strategy CTA */}
                    <button
                      className="btn-secondary"
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      onClick={() => {
                        sessionStorage.setItem("algolens_strategy", JSON.stringify(strategy));
                        sessionStorage.setItem("algolens_platform", platformId);
                        router.push("/results");
                      }}
                    >
                      Voir la stratégie complète {p.icon} →
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Restart */}
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <button className="btn-primary" onClick={() => { setStep("select"); setSelected([]); setResults(null); }}>
                🔄 Nouvelle comparaison
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1f26; color: #f0f2f5; }
      `}</style>
    </main>
  );
}
