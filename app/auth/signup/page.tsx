"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="glass fade-up" style={{ width: "100%", maxWidth: "420px", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📬</div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "10px" }}>Vérifie ta boîte mail</h1>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "24px", fontSize: "0.9rem" }}>
            Un email de confirmation a été envoyé à <strong style={{ color: "var(--text)" }}>{email}</strong>.
            <br />Clique sur le lien pour activer ton compte.
          </p>
          <button className="btn-secondary" onClick={() => router.push("/auth/login")}>
            ← Retour à la connexion
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      {/* BG orb */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div className="glass fade-up" style={{ width: "100%", maxWidth: "420px", padding: "40px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span className="badge badge-purple" style={{ marginBottom: "14px", display: "inline-flex" }}>🧠 AlgoLens</span>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>
            Créer un compte
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Sauvegarde tes stratégies dans le cloud
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
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
              Mot de passe <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(8 caractères min.)</span>
            </label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
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
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Déjà un compte ?{" "}
          <button
            onClick={() => router.push("/auth/login")}
            style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "0.85rem" }}
          >
            Se connecter
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
