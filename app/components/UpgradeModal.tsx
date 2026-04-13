"use client";

import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  feature: "compare" | "veille" | "analysis_limit";
  used?: number;
  limit?: number;
  onClose: () => void;
}

const FEATURE_COPY = {
  compare: {
    icon: "⚖️",
    title: "Mode Comparaison — Pro uniquement",
    desc: "Compare 2 plateformes côte à côte avec le même profil. Disponible dès le plan Pro.",
  },
  veille: {
    icon: "📡",
    title: "Veille algorithmique — Pro uniquement",
    desc: "Lance des veilles à la demande et reçois les mises à jour des algorithmes chaque semaine. Disponible dès le plan Pro.",
  },
  analysis_limit: {
    icon: "🔒",
    title: "Limite atteinte",
    desc: "",
  },
} as const;

export default function UpgradeModal({ feature, used, limit, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const copy = FEATURE_COPY[feature];

  const desc = feature === "analysis_limit"
    ? `Tu as utilisé ${used ?? 0}/${limit ?? 3} analyses ce mois-ci. Passe au plan Pro pour des analyses illimitées.`
    : copy.desc;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{ maxWidth: "460px", width: "100%", padding: "36px", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem", padding: "4px" }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{copy.icon}</div>

        {/* Title */}
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "10px", letterSpacing: "-0.01em" }}>
          {copy.title}
        </h2>

        {/* Desc */}
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "28px" }}>
          {desc}
        </p>

        {/* Plans mini */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 700, color: "#a78bfa" }}>Pro</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "8px" }}>Analyses illimitées · Comparaison · Veille</span>
            </div>
            <span style={{ fontWeight: 700, color: "#a78bfa" }}>9€/mois</span>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 700, color: "#34d399" }}>🎓 Étudiant</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "8px" }}>Même chose, 2 mois</span>
            </div>
            <span style={{ fontWeight: 700, color: "#34d399" }}>15€</span>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            className="btn-primary"
            onClick={() => { router.push("/pricing"); onClose(); }}
            style={{ width: "100%", padding: "14px", fontSize: "0.95rem" }}
          >
            Voir les plans →
          </button>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "4px" }}
          >
            Continuer avec le plan Free
          </button>
        </div>
      </div>
    </div>
  );
}
