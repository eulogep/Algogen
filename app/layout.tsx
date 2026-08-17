import type { Metadata } from "next";
import "./globals.css";
import AuthButton from "./AuthButton";

// L’application lit habituellement une session à la requête ; conserver ce comportement
// évite de pré-rendre des pages d’authentification configurées dynamiquement.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AlgoLens — Social Algorithm Intelligence",
  description:
    "Analyse les algorithmes des réseaux sociaux et génère des stratégies de contenu personnalisées pour maximiser ta portée organique.",
  keywords: ["algorithme", "social media", "TikTok", "Instagram", "YouTube", "LinkedIn", "stratégie contenu"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div style={{
          position: "fixed", top: "16px", right: "20px", zIndex: 100,
        }}>
          {hasSupabaseConfig && <AuthButton />}
        </div>
        {children}
      </body>
    </html>
  );
}
