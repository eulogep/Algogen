"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isStudentEmail } from "@/lib/stripe";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  plan: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
}

const FEATURES = [
  { label: "Analyses / mois",         free: "3",          pro: "Illimitées",  student: "Illimitées" },
  { label: "Plateformes disponibles", free: "7",          pro: "7",           student: "7" },
  { label: "Mode Comparaison",        free: false,        pro: true,          student: true },
  { label: "Veille algorithmique",    free: false,        pro: true,          student: true },
  { label: "Export PDF",              free: true,         pro: true,          student: true },
  { label: "Historique cloud",        free: true,         pro: true,          student: true },
  { label: "Durée",                   free: "Toujours",   pro: "Mensuel",     student: "2 mois" },
];

function CheckIcon({ ok, value }: { ok?: boolean; value?: string }) {
  if (value !== undefined) return <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{value}</span>;
  return ok
    ? <span style={{ color: "#4ade80", fontSize: "1rem" }}>✓</span>
    : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "1rem" }}>—</span>;
}

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<"pro" | "student" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [showStudentInput, setShowStudentInput] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("plan, expires_at, stripe_customer_id")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    });

    if (searchParams.get("success") === "1") {
      const plan = searchParams.get("plan");
      setToast(plan === "student"
        ? "🎓 Bienvenue ! Ton accès étudiant est activé pour 2 mois."
        : "🚀 Bienvenue sur AlgoLens Pro ! Toutes les fonctionnalités sont débloquées.");
    }
    if (searchParams.get("canceled") === "1") {
      setToast("Paiement annulé. Tu peux réessayer quand tu veux.");
    }
  }, [searchParams]);

  const handleCheckout = async (plan: "pro" | "student") => {
    if (!user) { router.push("/auth/login?next=/pricing"); return; }

    if (plan === "student" && showStudentInput) {
      if (!isStudentEmail(studentEmail)) {
        setError("Cet email ne correspond pas à un domaine universitaire reconnu (.edu, .ac.fr, .univ-*, etc.)");
        return;
      }
    } else if (plan === "student" && !showStudentInput) {
      setShowStudentInput(true);
      return;
    }

    setLoading(plan);
    setError(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, studentEmail: plan === "student" ? studentEmail : undefined }),
    });

    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setError(data.error ?? "Erreur lors du paiement.");
      return;
    }

    window.location.href = data.url;
  };

  const handlePortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const currentPlan = profile?.plan ?? "free";
  const isExpired = profile?.expires_at ? new Date(profile.expires_at) < new Date() : false;

  return (
    <main style={{ minHeight: "100vh", padding: "40px 20px 80px", position: "relative", zIndex: 1 }}>
      {/* BG orb */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "800px", background: "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)", padding: "14px 24px", borderRadius: "12px", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontWeight: 600, fontSize: "0.9rem", zIndex: 200, whiteSpace: "nowrap" }}>
          {toast}
          <button onClick={() => setToast(null)} style={{ marginLeft: "12px", background: "none", border: "none", color: "#4ade80", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: "56px" }}>
          <button className="btn-secondary" onClick={() => router.push("/")} style={{ marginBottom: "32px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            ← Retour
          </button>

          <span className="badge badge-purple" style={{ marginBottom: "16px", display: "inline-flex" }}>💎 Plans & Tarifs</span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            Choisir ton plan <span className="gradient-text">AlgoLens</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "500px", margin: "0 auto" }}>
            Commence gratuitement. Passe au Pro pour débloquer les analyses illimitées, la comparaison et la veille.
          </p>
        </div>

        {/* ── Plans grid ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "48px", alignItems: "stretch" }}>

          {/* Free */}
          <PlanCard
            name="Free"
            icon="✦"
            price="Gratuit"
            highlight={false}
            current={currentPlan === "free" && !isExpired}
            badge={null}
            color="var(--text-muted)"
            features={["3 analyses / mois", "7 plateformes", "Export PDF", "Historique cloud"]}
            lockedFeatures={["Mode Comparaison", "Veille algorithmique"]}
            cta={currentPlan === "free" ? "Plan actuel" : undefined}
            ctaDisabled={currentPlan === "free"}
            onCta={() => {}}
          />

          {/* Pro */}
          <PlanCard
            name="Pro"
            icon="⚡"
            price="9€"
            priceSub="/mois"
            highlight={true}
            current={currentPlan === "pro"}
            badge="Le plus populaire"
            color="#a78bfa"
            features={["Analyses illimitées", "7 plateformes", "Mode Comparaison", "Veille algorithmique", "Export PDF", "Historique cloud"]}
            lockedFeatures={[]}
            cta={
              currentPlan === "pro" ? "Plan actuel" :
              loading === "pro" ? "Redirection..." : "Passer au Pro →"
            }
            ctaDisabled={currentPlan === "pro" || loading !== null}
            onCta={() => handleCheckout("pro")}
            onManage={currentPlan === "pro" && profile?.stripe_customer_id ? handlePortal : undefined}
          />

          {/* Student */}
          <PlanCard
            name="Étudiant"
            icon="🎓"
            price="15€"
            priceSub="pour 2 mois"
            priceNote="= 7,50€/mois"
            highlight={false}
            current={currentPlan === "student" && !isExpired}
            badge="🎓 Offre Étudiante"
            badgeColor="#34d399"
            color="#34d399"
            features={["Analyses illimitées", "7 plateformes", "Mode Comparaison", "Veille algorithmique", "Export PDF", "Historique cloud"]}
            lockedFeatures={[]}
            cta={
              currentPlan === "student" && !isExpired ? "Plan actuel" :
              loading === "student" ? "Vérification..." :
              showStudentInput ? "Valider mon email →" : "Activer l'offre étudiante →"
            }
            ctaDisabled={(currentPlan === "student" && !isExpired) || loading !== null}
            onCta={() => handleCheckout("student")}
            studentInput={showStudentInput ? (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-muted)" }}>
                  Email universitaire
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="prenom.nom@univ-paris.fr"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  style={{ fontSize: "0.85rem" }}
                />
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Domaines acceptés : .edu, .ac.fr, .univ-*, .etu.*, .ac.uk…
                </p>
              </div>
            ) : null}
            expiresAt={currentPlan === "student" && !isExpired ? profile?.expires_at ?? null : null}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: "0.88rem", marginBottom: "24px", textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Feature comparison table ──────────────────────────────── */}
        <div className="glass fade-up" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "24px", letterSpacing: "-0.01em" }}>Comparaison détaillée</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>Fonctionnalité</th>
                  {["Free", "Pro", "Étudiant"].map((p) => (
                    <th key={p} style={{ textAlign: "center", padding: "8px 12px", fontWeight: 700, borderBottom: "1px solid var(--border)", color: p === "Pro" ? "#a78bfa" : p === "Étudiant" ? "#34d399" : "var(--text)" }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr key={f.label} style={{ borderBottom: i < FEATURES.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "12px", color: "var(--text-muted)" }}>{f.label}</td>
                    {(["free", "pro", "student"] as const).map((plan) => {
                      const val = f[plan];
                      return (
                        <td key={plan} style={{ padding: "12px", textAlign: "center" }}>
                          {typeof val === "boolean"
                            ? <CheckIcon ok={val} />
                            : <CheckIcon value={val} />
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note legal */}
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "32px", lineHeight: 1.6 }}>
          Paiements sécurisés par Stripe · L'offre étudiante est limitée à 1 utilisation par compte · Annulation Pro à tout moment depuis le portail
        </p>
      </div>
    </main>
  );
}

// ── PlanCard component ─────────────────────────────────────────────────────
function PlanCard({
  name, icon, price, priceSub, priceNote, highlight, current, badge, badgeColor, color,
  features, lockedFeatures, cta, ctaDisabled, onCta, onManage, studentInput, expiresAt,
}: {
  name: string; icon: string; price: string; priceSub?: string; priceNote?: string;
  highlight: boolean; current: boolean; badge: string | null; badgeColor?: string;
  color: string; features: string[]; lockedFeatures: string[];
  cta?: string; ctaDisabled?: boolean; onCta: () => void; onManage?: () => void;
  studentInput?: React.ReactNode; expiresAt?: string | null;
}) {
  return (
    <div
      className="glass"
      style={{
        padding: "28px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        border: highlight ? "1.5px solid rgba(167,139,250,0.4)" : undefined,
        background: highlight ? "rgba(124,58,237,0.06)" : undefined,
      }}
    >
      {/* Top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", borderRadius: "16px 16px 0 0", background: `linear-gradient(90deg, ${color}88, ${color}22)` }} />

      {/* Badge */}
      {badge && (
        <div style={{ marginBottom: "12px" }}>
          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700, background: badgeColor ? `${badgeColor}15` : "rgba(167,139,250,0.15)", color: badgeColor ?? "#a78bfa", border: `1px solid ${badgeColor ? `${badgeColor}30` : "rgba(167,139,250,0.3)"}` }}>
            {badge}
          </span>
        </div>
      )}

      {/* Plan name */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{ fontSize: "1.3rem" }}>{icon}</span>
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color }}>{name}</span>
        {current && <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 700, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>Actif</span>}
      </div>

      {/* Price */}
      <div style={{ marginBottom: "24px" }}>
        <span style={{ fontSize: "2.2rem", fontWeight: 900, color, letterSpacing: "-0.04em" }}>{price}</span>
        {priceSub && <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginLeft: "4px" }}>{priceSub}</span>}
        {priceNote && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{priceNote}</p>}
      </div>

      {/* Expiry */}
      {expiresAt && (
        <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", marginBottom: "16px" }}>
          <p style={{ fontSize: "0.75rem", color: "#34d399" }}>
            ⏳ Expire le {new Date(expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      )}

      {/* Student email input */}
      {studentInput}

      {/* Features */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
        {features.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
            <span style={{ color: "#4ade80", fontSize: "0.9rem" }}>✓</span>
            <span style={{ color: "var(--text-muted)" }}>{f}</span>
          </div>
        ))}
        {lockedFeatures.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", opacity: 0.4 }}>
            <span style={{ fontSize: "0.9rem" }}>—</span>
            <span style={{ color: "var(--text-muted)" }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className={highlight ? "btn-primary" : "btn-secondary"}
        onClick={onCta}
        disabled={ctaDisabled}
        style={{ width: "100%", padding: "13px", fontSize: "0.9rem", opacity: ctaDisabled ? 0.5 : 1, cursor: ctaDisabled ? "not-allowed" : "pointer" }}
      >
        {cta ?? "Choisir ce plan"}
      </button>

      {/* Manage subscription */}
      {onManage && (
        <button
          onClick={onManage}
          style={{ marginTop: "10px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.78rem", textDecoration: "underline" }}
        >
          Gérer mon abonnement →
        </button>
      )}
    </div>
  );
}
