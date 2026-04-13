"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const STYLE = {
  inter: { fontFamily: "'Inter', sans-serif" },
  mono: { fontFamily: "'JetBrains Mono', monospace" },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard/analytics");
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
        },
      });
      setStatus(error ? "error" : "success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      style={{ ...STYLE.inter, backgroundColor: "#09090b", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}
    >
      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* Central glow */}
      <div style={{
        position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "400px", pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(34,197,94,0.06) 0%, transparent 70%)",
      }} />

      {/* TOPBAR */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 28px", borderBottom: "1px solid #18181b", position: "relative", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 28, height: 28, background: "#22c55e", borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>AL</span>
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: "#fafafa" }}>AlgoLens</span>
        </div>
        <div style={{ ...STYLE.mono, fontSize: 11, color: "#3f3f46", border: "1px solid #1c1c1f", borderRadius: 20, padding: "5px 12px" }}>
          v1.0 · production
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 20, height: 1, background: "#22c55e" }} />
            <span style={{ ...STYLE.mono, fontSize: 11, color: "#22c55e", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Accès plateforme
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: "#fafafa", letterSpacing: "-.04em", lineHeight: 1.2, margin: 0 }}>
              Decode the<br />
              <span style={{ fontWeight: 500 }}>Algorithm.</span>
            </h1>
            <p style={{ marginTop: 12, fontSize: 13, color: "#52525b", lineHeight: 1.6, margin: "12px 0 0" }}>
              Entrez votre email pour recevoir votre lien de connexion instantané. Aucun mot de passe requis.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { value: "7", label: "Plateformes" },
              { value: "93%", label: "Cache hit" },
              { value: "<1ms", label: "Réponse L1" },
            ].map((s) => (
              <div key={s.label} style={{ borderLeft: "1px solid #22c55e", paddingLeft: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#fafafa" }}>{s.value}</div>
                <div style={{ ...STYLE.mono, fontSize: 10, color: "#3f3f46", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ ...STYLE.mono, fontSize: 11, color: "#3f3f46", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Email professionnel
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              disabled={status === "loading" || status === "success"}
              style={{
                background: "#111113",
                border: `1px solid ${status === "error" ? "#ef4444" : "#27272a"}`,
                borderRadius: 8,
                padding: "11px 14px",
                color: "#fafafa",
                fontSize: 13,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "'Inter', sans-serif",
                transition: "border-color .15s",
              }}
              onFocus={(e) => { if (status !== "error") e.target.style.borderColor = "#22c55e"; }}
              onBlur={(e) => { if (status !== "error") e.target.style.borderColor = "#27272a"; }}
            />
            {status === "error" && (
              <span style={{ ...STYLE.mono, fontSize: 11, color: "#ef4444" }}>Email invalide ou envoi échoué</span>
            )}

            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              style={{
                width: "100%",
                background: status === "success" ? "#16a34a" : "#22c55e",
                color: "#09090b",
                fontWeight: 500,
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 13,
                border: "none",
                cursor: status === "loading" || status === "success" ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background .2s",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {status === "loading" ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid #09090b", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
                  Envoi en cours...
                </>
              ) : status === "success" ? (
                "Lien envoyé · Vérifiez votre email ✓"
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                  Envoyer le lien magique
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#18181b" }} />
            <span style={{ ...STYLE.mono, fontSize: 11, color: "#27272a" }}>zero mot de passe</span>
            <div style={{ flex: 1, height: 1, background: "#18181b" }} />
          </div>

          {/* Hint box */}
          <div style={{
            background: "#111113", border: "1px solid #1c1c1f", borderRadius: 8,
            padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span style={{ ...STYLE.mono, fontSize: 11, color: "#3f3f46", lineHeight: 1.6 }}>
              Un lien sécurisé sera envoyé à votre adresse. Cliquez dessus pour accéder instantanément à AlgoLens. Valide 60 minutes.
            </span>
          </div>

        </div>
      </div>

      {/* BOTTOM STRIP */}
      <div style={{
        borderTop: "1px solid #18181b", padding: "16px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", zIndex: 10,
      }}>
        <span style={{ ...STYLE.mono, fontSize: 11, color: "#27272a" }}>
          AlgoLens · Magic Link Auth · Powered by Supabase
        </span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#27272a", display: "inline-block" }} />
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#27272a", display: "inline-block" }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: .3; }
        }
        .live-dot { animation: pulse-dot 2s ease-in-out infinite; }
        input::placeholder { color: #3f3f46; }
      `}</style>
    </div>
  );
}
