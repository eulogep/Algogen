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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-[#09090b]/80 backdrop-blur-md border-b border-[#18181b] py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-[28px] h-[28px] bg-[#22c55e] rounded-[7px] flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-white font-semibold text-[11px] leading-none">AL</span>
          </div>
          <span className="text-[13.5px] font-medium text-[#fafafa] tracking-tight">AlgoLens</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-6">
          <Link 
            href="/login" 
            className="text-[13px] text-[#52525b] hover:text-[#fafafa] transition-colors"
          >
            Se connecter
          </Link>
          <Link 
            href="/login" 
            className="bg-[#22c55e] text-[#09090b] text-[13px] font-medium px-4 py-[7px] rounded-[7px] hover:bg-[#22c55e]/90 transition-all active:scale-95"
          >
            Commencer →
          </Link>
        </div>
      </div>
    </nav>
  );
}
