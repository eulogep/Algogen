"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const STYLE = {
  inter: { fontFamily: "'Inter', sans-serif" },
};

export default function AuthButton({ initialUserEmail = null }: { initialUserEmail?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(initialUserEmail);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && key ? createBrowserClient(url, key) : null;
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!supabase || initialUserEmail) return undefined;

    void supabase.auth.getUser().then(({ data }) => {
      if (isMounted) setUserEmail(data.user?.email ?? null);
    });

    return () => {
      isMounted = false;
    };
  }, [initialUserEmail, supabase]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push("/login");
    router.refresh();
  };

  if (pathname === "/login" || pathname === "/lyrics" || pathname?.startsWith("/dashboard")) return null;

  if (userEmail) {
    const initials = userEmail.substring(0, 2).toUpperCase();
    return (
      <div style={{ position: "relative", ...STYLE.inter }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            width: "26px", height: "26px", borderRadius: "50%",
            background: "#18181b", border: "1px solid #27272a",
            color: "#a1a1aa", fontSize: "11px", fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0
          }}
        >
          {initials}
        </button>
        
        {showDropdown && (
          <div style={{
            position: "absolute", top: "100%", right: 0, marginTop: "8px",
            background: "#18181b", border: "1px solid #27272a",
            borderRadius: "8px", padding: "4px", minWidth: "160px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: 1000
          }}>
            <div style={{ 
              padding: "8px", fontSize: "12px", color: "#a1a1aa", borderBottom: "1px solid #27272a", 
              marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
            }}>
              {userEmail}
            </div>
            <button
              onClick={handleSignOut}
              style={{
                width: "100%", textAlign: "left", padding: "8px", fontSize: "12px",
                color: "#ef4444", background: "transparent", border: "none", cursor: "pointer",
                borderRadius: "4px", transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#27272a"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    );
  }

  // Utilisateur non connecté -> Bouton Connexion discret
  return (
    <button
      onClick={() => router.push("/login")}
      style={{
        ...STYLE.inter,
        border: "1px solid #27272a", borderRadius: "6px",
        background: "transparent", color: "#71717a",
        fontSize: "12px", padding: "5px 12px",
        cursor: "pointer", transition: "color 0.2s"
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = "#fafafa"}
      onMouseLeave={(e) => e.currentTarget.style.color = "#71717a"}
    >
      Connexion
    </button>
  );
}
