"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PLATFORM_MAP } from "@/lib/platforms";
import type { UserProfile, PlatformId, AnalyzeResponse } from "@/lib/types";

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
  { value: "beginner", label: "🌱 Débutant (0-1k followers)" },
  { value: "intermediate", label: "📈 Intermédiaire (1k-50k)" },
  { value: "advanced", label: "🔥 Avancé (50k+)" },
];

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const platformId = params.platform as PlatformId;
  const platform = PLATFORM_MAP[platformId];

  const [profile, setProfile] = useState<UserProfile>({
    niche: "",
    contentType: "educational",
    targetAudience: "",
    objective: "visibility",
    currentFrequency: "",
    level: "beginner",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!platform) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <p style={{ color: "var(--text-muted)" }}>Plateforme introuvable.</p>
        <button className="btn-secondary" style={{ marginTop: "16px" }} onClick={() => router.push("/")}>
          ← Retour
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.niche || !profile.targetAudience || !profile.currentFrequency) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId, userProfile: profile }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur API");
      }
      const strategy: AnalyzeResponse = await res.json();
      sessionStorage.setItem("algolens_strategy", JSON.stringify(strategy));
      sessionStorage.setItem("algolens_platform", platformId);
      sessionStorage.setItem("algolens_profile", JSON.stringify(profile));
      router.push("/results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", padding: "40px 20px", position: "relative", zIndex: 1 }}>
      {/* Background orb */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "600px",
        background: `radial-gradient(ellipse, ${platform.color}12 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        {/* Back */}
        <button
          className="btn-secondary fade-up"
          onClick={() => router.push("/")}
          style={{ marginBottom: "32px", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          ← Retour
        </button>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: `${platform.color}18`, border: `1px solid ${platform.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem",
            }}>
              {platform.icon}
            </div>
            <div>
              <p className="section-label" style={{ marginBottom: "4px" }}>{platform.label}</p>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Ton profil créateur
              </h1>
            </div>
          </div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            Plus tes réponses sont précises, plus la stratégie générée sera pertinente et actionnable.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="fade-up fade-up-delay-1">
          <div className="glass" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* Niche */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px", color: "var(--text)" }}>
                Niche / Secteur d&apos;activité *
              </label>
              <input
                className="input"
                type="text"
                placeholder="Ex: Développement personnel, Finance, Cuisine végane, Tech..."
                value={profile.niche}
                onChange={(e) => setProfile({ ...profile, niche: e.target.value })}
              />
            </div>

            {/* Content type */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px", color: "var(--text)" }}>
                Type de contenu principal *
              </label>
              <select
                className="select"
                value={profile.contentType}
                onChange={(e) => setProfile({ ...profile, contentType: e.target.value as UserProfile["contentType"] })}
              >
                {CONTENT_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Audience */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px", color: "var(--text)" }}>
                Audience cible *
              </label>
              <input
                className="input"
                type="text"
                placeholder="Ex: 25-35 ans, entrepreneurs, intéressés par la productivité..."
                value={profile.targetAudience}
                onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
              />
            </div>

            {/* Objective */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px", color: "var(--text)" }}>
                Objectif principal *
              </label>
              <select
                className="select"
                value={profile.objective}
                onChange={(e) => setProfile({ ...profile, objective: e.target.value as UserProfile["objective"] })}
              >
                {OBJECTIVES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px", color: "var(--text)" }}>
                Fréquence de publication actuelle *
              </label>
              <input
                className="input"
                type="text"
                placeholder="Ex: 1 post par semaine, 3 Reels/semaine, pas encore actif..."
                value={profile.currentFrequency}
                onChange={(e) => setProfile({ ...profile, currentFrequency: e.target.value })}
              />
            </div>

            {/* Level */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "12px", color: "var(--text)" }}>
                Niveau actuel
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {LEVELS.map((l) => (
                  <label
                    key={l.value}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px 16px", borderRadius: "10px", cursor: "pointer",
                      background: profile.level === l.value ? "rgba(124,58,237,0.12)" : "var(--surface-2)",
                      border: `1px solid ${profile.level === l.value ? "rgba(124,58,237,0.4)" : "var(--border)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={l.value}
                      checked={profile.level === l.value}
                      onChange={() => setProfile({ ...profile, level: l.value as UserProfile["level"] })}
                      style={{ accentColor: "#7c3aed" }}
                    />
                    <span style={{ fontSize: "0.9rem" }}>{l.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: "10px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171", fontSize: "0.88rem",
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", fontSize: "1rem", padding: "16px", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Analyse en cours...
                </span>
              ) : (
                "✨ Générer ma stratégie"
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1f26; color: #f0f2f5; }
      `}</style>
    </main>
  );
}
