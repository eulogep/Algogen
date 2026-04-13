"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback_failed") {
      setError("Le lien de connexion a expiré. Essaie à nouveau.");
    }
    if (searchParams.get("confirmed") === "1") {
      setMessage("Email confirmé ! Tu peux maintenant te connecter.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect."
        : error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      {/* BG orb */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div className="glass fade-up" style={{ width: "100%", maxWidth: "420px", padding: "40px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span className="badge badge-purple" style={{ marginBottom: "14px", display: "inline-flex" }}>🧠 AlgoLens</span>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>
            Connexion
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Accède à ton historique cloud
          </p>
        </div>

        {message && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", fontSize: "0.88rem", marginBottom: "20px" }}>
            ✅ {message}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "7px", color: "var(--text)" }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "7px", color: "var(--text)" }}>
              Mot de passe
            </label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: "0.88rem" }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "14px", fontSize: "0.95rem", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Pas encore de compte ?{" "}
          <button
            onClick={() => router.push("/auth/signup")}
            style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "0.85rem" }}
          >
            Créer un compte
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.82rem", padding: 0 }}
          >
            ← Continuer sans compte
          </button>
        </div>
      </div>
    </main>
  );
}
