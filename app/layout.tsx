import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import AuthButton from "./AuthButton";

export const metadata: Metadata = {
  title: "AlgoLens — Social Algorithm Intelligence",
  description:
    "Analyse les algorithmes des réseaux sociaux et génère des stratégies de contenu personnalisées pour maximiser ta portée organique.",
  keywords: ["algorithme", "social media", "TikTok", "Instagram", "YouTube", "LinkedIn", "stratégie contenu"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
          <AuthButton userEmail={user?.email || null} />
        </div>
        {children}
      </body>
    </html>
  );
}
