"use client";

import React from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STYLE = {
  fontInter: { fontFamily: "'Inter', sans-serif" },
  fontMono: { fontFamily: "'JetBrains Mono', monospace" }
};

export default function DashboardSidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "??";
  const truncatedEmail = userEmail 
    ? (userEmail.length > 20 ? userEmail.substring(0, 17) + "..." : userEmail) 
    : "Non connecté";

  const NavItem = ({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href}
        className={`flex items-center space-x-2.5 px-2.5 py-[7px] rounded-[7px] text-[12.5px] transition-colors group ${
          isActive 
            ? "bg-[#18181b] text-[#fafafa]" 
            : "text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#18181b]"
        }`}
      >
        <span className={`opacity-${isActive ? "90" : "50 group-hover:opacity-90"} transition-opacity`}>
          {icon}
        </span>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="w-[220px] h-screen flex-shrink-0 flex flex-col justify-between border-r border-[#18181b] bg-[#09090b] z-10 hidden md:flex" style={STYLE.fontInter}>
      <div className="p-4">
        {/* Logo */}
        <div className="flex items-center space-x-2.5 mb-8">
          <div className="w-[26px] h-[26px] bg-[#22c55e] rounded-[7px] flex items-center justify-center">
            <span className="text-white font-semibold text-[11px] leading-none">AL</span>
          </div>
          <span className="text-[13px] font-medium text-[#fafafa]">AlgoLens</span>
        </div>

        {/* Nav: Navigation */}
        <div className="space-y-0.5">
           <div style={STYLE.fontMono} className="text-[10px] text-[#3f3f46] uppercase tracking-[.07em] mb-3 px-1">Navigation</div>
           
           <NavItem 
             href="/dashboard/analytics" 
             label="Overview" 
             icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>} 
           />
           
           <NavItem 
             href="/dashboard/analytics" 
             label="Cache analytics" 
             icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>} 
           />
           
           <NavItem 
             href="/updates" 
             label="Algo watch" 
             icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"></path></svg>} 
           />
           
           <NavItem 
             href="/strategies" 
             label="Stratégies" 
             icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>} 
           />
        </div>
      </div>

      {/* Sidebar Footer: User Profile */}
      <div className="border-t border-[#18181b] p-4 flex flex-col gap-3">
        {userEmail ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-[28px] h-[28px] rounded-full bg-[#18181b] border border-[#27272a] text-[#a1a1aa] text-[11px] flex items-center justify-center font-medium" style={STYLE.fontMono}>
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#3f3f46] truncate" title={userEmail}>
                  {truncatedEmail}
                </span>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-[11px] text-left text-[#3f3f46] hover:text-[#ef4444] transition-colors"
              style={STYLE.fontMono}
            >
              → Déconnexion
            </button>
          </>
        ) : (
          <Link 
            href="/login"
            className="text-[11px] text-[#3f3f46] hover:text-[#fafafa] transition-colors"
            style={STYLE.fontMono}
          >
            Se connecter
          </Link>
        )}
      </div>
    </div>
  );
}
