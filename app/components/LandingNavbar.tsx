"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-[#18181b] bg-[#09090b]/90 py-3 backdrop-blur-md"
          : "bg-transparent py-3 sm:py-4"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-[28px] h-[28px] bg-[#22c55e] rounded-[7px] flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-white font-semibold text-[11px] leading-none">AL</span>
          </div>
          <span className="text-[13.5px] font-medium text-[#fafafa] tracking-tight">AlgoLens</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/demo"
            className="hidden sm:inline text-[13px] text-[#a1a1aa] transition-colors hover:text-[#fafafa]"
          >
            Démo live
          </Link>
          <Link
            href="/about"
            className="hidden lg:inline text-[13px] text-[#a1a1aa] transition-colors hover:text-[#fafafa]"
          >
            À propos
          </Link>
          <Link
            href="/lyrics"
            className="hidden xl:inline text-[13px] text-[#86efac] transition-colors hover:text-[#fafafa]"
          >
            Laboratoire lexical
          </Link>
          <Link 
            href="/login" 
            className="hidden text-[13px] text-[#a1a1aa] transition-colors hover:text-[#fafafa] sm:inline"
          >
            Se connecter
          </Link>
          <Link 
            href="/login" 
            className="rounded-[7px] bg-[#22c55e] px-3.5 py-2 text-[13px] font-medium text-[#09090b] transition-all hover:bg-[#22c55e]/90 active:scale-95 sm:px-4"
          >
            Commencer →
          </Link>
        </div>
      </div>
    </nav>
  );
}
