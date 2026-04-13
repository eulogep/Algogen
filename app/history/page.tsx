"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_MAP } from "@/lib/platforms";
import { getHistory, deleteFromHistory, clearHistory } from "@/lib/history";
import { fetchHistory, removeHistory, removeAllHistory } from "@/lib/supabase/history-db";
import { createClient } from "@/lib/supabase/client";
import type { HistoryEntry, PlatformId } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

function getScoreColor(score: number): string {
  if (score >= 70) return "#4ade80";
  if (score >= 40) return "#fbbf24";
  return "#f87171";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Fort";
  if (score >= 40) return "Moyen";
  return "Faible";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const OBJECTIVE_LABELS: Record<string, string> = {
  visibility: "🚀 Visibilité",
  subscribers: "👥 Abonnés",
  sales: "💰 Ventes",
  engagement: "💬 Engagement",
  brand_awareness: "🌐 Notoriété",
};

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchHistory().then((data) => {
          setEntries(data);
          setLoadingEntries(false);
          setMounted(true);
        });
      } else {
        setEntries(getHistory());
        setLoadingEntries(false);
        setMounted(true);
      }
    });
  }, []);

  const handleLoad = (entry: HistoryEntry) => {
    sessionStorage.setItem("algolens_strategy", JSON.stringify(entry.strategy));
    sessionStorage.setItem("algolens_platform", entry.platformId);
    router.push("/results");
  };

  const handleDelete = async (id: string) => {
    if (user) {
      await removeHistory(id);
    } else {
      deleteFromHistory(id);
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClearAll = async () => {
    if (user) {
      await removeAllHistory();
    } else {
      clearHistory();
    }
    setEntries([]);
    setConfirmClear(false);
  };

  if (!mounted || loadingEntries) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", padding: "40px 20px 80px", position: "relative", zIndex: 1 }}>
      {/* BG orb */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: "36px" }}>
          <button className="btn-secondary" onClick={() => router.push("/")} style={{ marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            ← Retour
          </button>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <span className="badge badge-purple" style={{ marginBottom: "12px", display: "inline-flex" }}>🕐 Historique</span>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>
                Tes stratégies <span className="gradient-text">générées</span>
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {entries.length === 0
                  ? "Aucune stratégie sauvegardée pour l'instant."
                  : `${entries.length} stratégie${entries.length > 1 ? "s" : ""} sauvegardée${entries.length > 1 ? "s" : ""} ${user ? "dans le cloud" : "localement"}.`}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
              {/* Cloud badge */}
              {user ? (
                <span className="badge" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)", fontSize: "0.75rem" }}>
                  ☁️ Cloud sync activé
                </span>
              ) : (
                <button
                  onClick={() => router.push("/auth/login")}
                  className="btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  🔐 Connexion pour sync cloud
                </button>
              )}

              {entries.length > 0 && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {confirmClear ? (
                    <>
                      <span style={{ fontSize: "0.85rem", color: "#f87171" }}>Confirmer ?</span>
                      <button className="btn-secondary" onClick={() => setConfirmClear(false)} style={{ padding: "8px 14px", fontSize: "0.82rem" }}>Annuler</button>
                      <button onClick={handleClearAll} style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
                        Tout supprimer
                      </button>
                    </>
                  ) : (
                    <button className="btn-secondary" onClick={() => setConfirmClear(true)} style={{ padding: "8px 14px", fontSize: "0.82rem" }}>
                      🗑 Tout effacer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <hr className="divider" />
        </div>

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="glass fade-up" style={{ padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>Aucune stratégie sauvegardée</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "0.9rem" }}>
              Génère une première stratégie depuis la page d&apos;accueil — elle apparaîtra ici automatiquement.
            </p>
            <button className="btn-primary" onClick={() => router.push("/")}>
              Analyser une plateforme →
            </button>
          </div>
        )}

        {/* Entry list */}
        {entries.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {entries.map((entry, idx) => {
              const platform = PLATFORM_MAP[entry.platformId as PlatformId];
              const scoreColor = getScoreColor(entry.score);
              const scoreLabel = getScoreLabel(entry.score);

              return (
                <div
                  key={entry.id}
                  className="glass"
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                    animation: `fadeUp 0.4s ease ${idx * 0.04}s forwards`,
                    opacity: 0,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Platform color stripe */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: platform?.color ?? "#7c3aed", borderRadius: "16px 0 0 16px" }} />

                  {/* Platform icon */}
                  <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: `${platform?.color ?? "#7c3aed"}18`, border: `1px solid ${platform?.color ?? "#7c3aed"}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                    {platform?.icon ?? "📊"}
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{platform?.label ?? entry.platformId}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>·</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{formatDate(entry.date)}</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      <strong style={{ color: "var(--text)" }}>{entry.niche}</strong>
                      {" · "}
                      {OBJECTIVE_LABELS[entry.objective] ?? entry.objective}
                    </p>
                  </div>

                  {/* Score badge */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 900, color: scoreColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {entry.score}
                    </span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: scoreColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {scoreLabel}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleLoad(entry)}
                      style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                    >
                      ↗ Charger
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", transition: "all 0.2s" }}
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
