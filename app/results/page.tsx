"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_MAP } from "@/lib/platforms";
import { saveToHistory } from "@/lib/history";
import { insertHistory } from "@/lib/supabase/history-db";
import { createClient } from "@/lib/supabase/client";
import type { AnalyzeResponse, PlatformId } from "@/lib/types";

// ── Score gauge ────────────────────────────────────────────────────────────
function ScoreGauge({ score, color }: { score: number; color: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {/* Track */}
      <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
      {/* Progress */}
      <circle
        cx="70" cy="70" r={radius} fill="none"
        stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
      />
      {/* Score text */}
      <text x="70" y="65" textAnchor="middle" fill="white" fontSize="26" fontWeight="800" fontFamily="Inter, sans-serif">
        {score}
      </text>
      <text x="70" y="82" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="Inter, sans-serif">
        / 100
      </text>
    </svg>
  );
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#4ade80";
  if (score >= 40) return "#fbbf24";
  return "#f87171";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Fort alignement";
  if (score >= 40) return "Alignement moyen";
  return "Faible alignement";
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<{ strategy: AnalyzeResponse; platformId: PlatformId } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("algolens_strategy");
    const pid = sessionStorage.getItem("algolens_platform") as PlatformId | null;
    if (!raw || !pid) { router.push("/"); return; }
    const parsed = JSON.parse(raw) as AnalyzeResponse;
    setData({ strategy: parsed, platformId: pid });

    // Persist to history (fire-and-forget)
    const rawProfile = sessionStorage.getItem("algolens_profile");
    const profile = rawProfile ? JSON.parse(rawProfile) : null;
    const niche = profile?.niche ?? "—";
    const objective = profile?.objective ?? "visibility";
    const level = profile?.level ?? "beginner";

    const persist = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await insertHistory(pid, niche, objective, level, parsed);
      } else {
        saveToHistory(pid, niche, objective, level, parsed);
      }
    };
    persist();
  }, [router]);

  if (!data) {

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { strategy, platformId } = data;
  const platform = PLATFORM_MAP[platformId];
  const scoreColor = getScoreColor(strategy.potential_score ?? 0);
  const scoreLabel = getScoreLabel(strategy.potential_score ?? 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatStrategyAsText(strategy, platform?.label ?? platformId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRestart = () => {
    sessionStorage.removeItem("algolens_strategy");
    sessionStorage.removeItem("algolens_platform");
    router.push("/");
  };

  const handlePdf = () => window.print();

  return (
    <main
      id="results-print-root"
      style={{ minHeight: "100vh", padding: "40px 20px 80px", position: "relative", zIndex: 1 }}
    >
      {/* BG orb */}
      <div className="no-print" style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "700px", height: "700px", background: `radial-gradient(ellipse, ${platform?.color ?? "#7c3aed"}10 0%, transparent 65%)`, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "820px", margin: "0 auto" }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div className="fade-up" style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.8rem" }}>{platform?.icon}</span>
              <div>
                <p className="section-label" style={{ marginBottom: "2px" }}>{platform?.label} — Stratégie personnalisée</p>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Ta stratégie <span className="gradient-text">AlgoLens</span>
                </h1>
              </div>
            </div>
            <div className="no-print" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button className="btn-secondary" onClick={handleRestart}>← Recommencer</button>
              <button className="btn-secondary" onClick={handleCopy}>{copied ? "✅ Copié !" : "📋 Copier"}</button>
              <button className="btn-primary" onClick={handlePdf} style={{ padding: "10px 20px" }}>⬇ Exporter PDF</button>
            </div>
          </div>
          <hr className="divider" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── 1. Score Card ──────────────────────────────── */}
          <div
            className="glass fade-up"
            style={{ padding: "28px", display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}
          >
            {/* Gauge */}
            <div style={{ flexShrink: 0 }}>
              <ScoreGauge score={strategy.potential_score ?? 0} color={scoreColor} />
            </div>

            {/* Score info */}
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "1.3rem" }}>🎯</span>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Potentiel algorithmique</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span className="badge" style={{ background: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}40`, fontSize: "0.72rem" }}>
                  {scoreLabel}
                </span>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: scoreColor, letterSpacing: "-0.04em" }}>
                  {strategy.potential_score ?? "—"}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>/ 100</span>
              </div>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-muted)", fontStyle: "italic" }}>
                {strategy.score_justification}
              </p>
            </div>

            {/* Score scale legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
              {[
                { range: "70–100", label: "Fort", color: "#4ade80" },
                { range: "40–69", label: "Moyen", color: "#fbbf24" },
                { range: "0–39", label: "Faible", color: "#f87171" },
              ].map((item) => (
                <div key={item.range} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <strong style={{ color: item.color }}>{item.label}</strong> {item.range}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. Quick Wins ──────────────────────────────── */}
          <Section delay={0.05} icon="⚡" title="Quick Wins — Actions à faire dans les 48h" color="#f59e0b">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(strategy.quick_wins ?? []).map((win, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "14px 16px", borderRadius: "12px",
                    background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.82rem", color: "#fbbf24" }}>
                      {i + 1}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.88rem", lineHeight: 1.65, color: "var(--text-muted)" }}>{win}</span>
                  </div>
                  <div className="no-print" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <span style={{ fontSize: "0.7rem", color: "#fbbf24", fontWeight: 600 }}>⏱ 48h</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 3. Algorithm Summary ───────────────────────── */}
          <Section delay={0.1} icon="🔍" title="Résumé de l'algorithme" color="#7c3aed">
            <p style={{ lineHeight: 1.8, color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {strategy.algorithm_summary}
            </p>
          </Section>

          {/* ── 4. Top 5 Levers ────────────────────────────── */}
          <Section delay={0.15} icon="🎯" title="Les 5 leviers prioritaires" color="#0ea5e9">
            <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              {strategy.top_5_levers.map((lever, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0, background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", color: "#38bdf8" }}>{i + 1}</span>
                  <span style={{ lineHeight: 1.65, fontSize: "0.9rem", color: "var(--text-muted)" }}>{lever}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* ── 5. Weekly Plan ─────────────────────────────── */}
          <Section delay={0.2} icon="📅" title="Plan d'action sur 4 semaines" color="#10b981">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
              {(["week1", "week2", "week3", "week4"] as const).map((week, i) => (
                <div key={week} style={{ padding: "16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#34d399", marginBottom: "8px" }}>
                    Semaine {i + 1}
                  </p>
                  <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-muted)" }}>
                    {strategy.weekly_plan[week]}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 6. Content Examples ────────────────────────── */}
          <Section delay={0.25} icon="💡" title="Exemples de contenu concrets" color="#a855f7">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {strategy.content_examples.map((ex, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", borderRadius: "10px", background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "2px" }}>💡</span>
                  <span style={{ fontSize: "0.88rem", lineHeight: 1.65, color: "var(--text-muted)" }}>{ex}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 7. Mistakes ────────────────────────────────── */}
          <Section delay={0.3} icon="⚠️" title="Erreurs critiques à éviter" color="#ef4444">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {strategy.mistakes_to_avoid.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "2px" }}>❌</span>
                  <span style={{ fontSize: "0.88rem", lineHeight: 1.65, color: "var(--text-muted)" }}>{m}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Bottom CTA ─────────────────────────────────── */}
          <div className="glass no-print" style={{ padding: "28px", textAlign: "center", animation: `fadeUp 0.5s ease 0.35s forwards`, opacity: 0 }}>
            <p style={{ fontWeight: 600, marginBottom: "16px" }}>Prêt à analyser une autre plateforme ?</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={handleRestart}>🔄 Nouvelle analyse</button>
              <button className="btn-secondary" onClick={() => router.push("/compare")}>⚖️ Mode Comparaison</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          #results-print-root { padding: 0 !important; }
        }
      `}</style>
    </main>
  );
}

// ── Reusable Section ───────────────────────────────────────────────────────
function Section({ icon, title, color, delay, children }: { icon: string; title: string; color: string; delay: number; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: "28px", animation: `fadeUp 0.5s ease ${delay}s forwards`, opacity: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>{icon}</div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Text export ────────────────────────────────────────────────────────────
function formatStrategyAsText(strategy: AnalyzeResponse, platformLabel: string): string {
  return `
AlgoLens — Stratégie ${platformLabel}
=======================================

🎯 SCORE DE POTENTIEL ALGORITHMIQUE : ${strategy.potential_score ?? "—"}/100
${strategy.score_justification ?? ""}

⚡ QUICK WINS (48h)
${(strategy.quick_wins ?? []).map((w, i) => `${i + 1}. ${w}`).join("\n")}

🔍 RÉSUMÉ DE L'ALGORITHME
${strategy.algorithm_summary}

🎯 TOP 5 LEVIERS
${strategy.top_5_levers.map((l, i) => `${i + 1}. ${l}`).join("\n")}

📅 PLAN 4 SEMAINES
Semaine 1: ${strategy.weekly_plan.week1}
Semaine 2: ${strategy.weekly_plan.week2}
Semaine 3: ${strategy.weekly_plan.week3}
Semaine 4: ${strategy.weekly_plan.week4}

💡 EXEMPLES DE CONTENU
${strategy.content_examples.map((e, i) => `${i + 1}. ${e}`).join("\n")}

⚠️ ERREURS À ÉVITER
${strategy.mistakes_to_avoid.map((m, i) => `${i + 1}. ${m}`).join("\n")}

— Généré par AlgoLens v1.0
`.trim();
}
