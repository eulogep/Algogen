import React from "react";
import Link from "next/link";
import LandingNavbar from "./components/LandingNavbar";

const STYLE = {
  fontInter: { fontFamily: "'Inter', sans-serif" },
  fontMono: { fontFamily: "'JetBrains Mono', monospace" }
};

export default function LandingPage() {
  return (
    <div className="bg-[#09090b] text-[#fafafa] selection:bg-[#22c55e]/30" style={STYLE.fontInter}>
      <LandingNavbar />

      {/* ────────────────── SECTION 2: HERO ────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 overflow-hidden">
        {/* Background Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.4]"
          style={{
            backgroundImage: `linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
        {/* Glow Orb */}
        <div 
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div 
            className="inline-flex items-center px-3 py-1 rounded-full border border-[#27272a] bg-[#111113] mb-8 animate-fade-in"
            style={STYLE.fontMono}
          >
            <span className="text-[11px] text-[#22c55e] uppercase tracking-wider">Veille algorithmique · 7 plateformes</span>
          </div>

          <h1 className="text-[42px] md:text-[56px] font-light leading-[1.05] tracking-tight mb-8">
            Comprendre <span className="font-medium text-[#fafafa]">l'algorithme</span>.<br/>
            Dominer le <span className="font-medium text-[#fafafa]">reach</span>.
          </h1>

          <p className="text-[#52525b] text-[16px] md:text-[17px] leading-relaxed max-w-[480px] mx-auto mb-10">
            AlgoLens analyse les signaux cachés des plateformes et génère une stratégie de contenu sur-mesure en 3 secondes.
          </p>

          <div className="flex flex-col items-center space-y-4">
            <Link 
              href="/login"
              className="group relative bg-[#22c55e] text-[#09090b] px-10 py-4 rounded-[8px] text-[14.5px] font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            >
              Commencer gratuitement →
            </Link>
            <span style={STYLE.fontMono} className="text-[11px] text-[#3f3f46]">
              3 analyses offertes · Sans carte bancaire
            </span>
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 3: STATS BAR ────────────────── */}
      <section className="bg-[#111113] border-y border-[#18181b] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-x-0 md:divide-x divide-[#18181b]">
            <StatItem value="93%" label="réduction coûts API" />
            <StatItem value="<1ms" label="réponse cache L1" />
            <StatItem value="7" label="plateformes couvertes" />
            <StatItem value="30j" label="plan d'action généré" />
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 4: DEMO VISUELLE ────────────────── */}
      <section className="py-24 px-6">
        <h2 className="text-center text-[28px] font-light mb-16 tracking-tight">Votre stratégie en 3 secondes</h2>
        <div className="max-w-[720px] mx-auto border border-[#27272a] rounded-[12px] bg-[#09090b] overflow-hidden shadow-2xl relative group">
          {/* Card Header */}
          <div className="bg-[#111113] border-b border-[#27272a] p-3 px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span style={STYLE.fontMono} className="text-[11px] text-[#a1a1aa]">AlgoLens · TikTok FYP</span>
            </div>
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1f]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1f]" />
            </div>
          </div>
          {/* Card Content */}
          <div className="p-8 space-y-8 min-h-[300px]">
            <div>
              <h3 className="text-[#22c55e] text-[13px] font-medium mb-2" style={STYLE.fontMono}>📅 Semaine 1 — Hook & Découverte</h3>
              <p className="text-[13.5px] text-[#a1a1aa] leading-relaxed">
                Publiez 5x/semaine entre 18h-20h. Durée optimale : 23-27 secondes. Hook dans les 1.5 premières secondes. Utilisez le son trending #1 pour booster la rétention initiale.
              </p>
            </div>
            <div>
              <h3 className="text-[#22c55e] text-[13px] font-medium mb-2" style={STYLE.fontMono}>📈 Métrique clé : Audio Watchtime</h3>
              <p className="text-[13.5px] text-[#a1a1aa] leading-relaxed">
                L'algorithme v4 privilégie les vidéos dont l'audio est écouté jusqu'au bout. Intégrez des sous-titres dynamiques pour forcer l'engagement visuel.
              </p>
            </div>
            <div className="h-px bg-[#18181b] w-full" />
            <div className="flex justify-between items-center text-[10px] text-[#3f3f46]" style={STYLE.fontMono}>
              <span>Généré en 2.3s · Cache L1</span>
              <span>TikTok FYP Algorithm v4</span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 5: PLATEFORMES ────────────────── */}
      <section className="py-24 bg-[#09090b]">
        <h2 className="text-center text-[28px] font-light mb-12 tracking-tight">7 algorithmes décryptés</h2>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-3">
          {[
            "TikTok", "Instagram Reels", "Instagram Feed", "YouTube Shorts", 
            "YouTube Long", "LinkedIn", "X/Twitter"
          ].map(p => (
            <div 
              key={p}
              className="px-5 py-2.5 rounded-full border border-[#27272a] text-[12.5px] text-[#71717a] transition-all hover:border-[#22c55e] hover:text-[#fafafa] cursor-default"
            >
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── SECTION 6: COMMENT ÇA MARCHE ────────────────── */}
      <section className="py-24 px-6 border-t border-[#18181b]">
        <h2 className="text-center text-[28px] font-light mb-20 tracking-tight">Simple par design</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-16">
          <StepItem 
            num="01" 
            title="Décrivez votre profil" 
            desc="Niche, type de contenu, audience cible, objectif. 30 secondes seulement." 
          />
          <StepItem 
            num="02" 
            title="L'IA analyse l'algorithme" 
            desc="Claude 3.5 Sonnet croise votre profil avec les signaux temps réel de la plateforme." 
          />
          <StepItem 
            num="03" 
            title="Recevez votre stratégie" 
            desc="Plan 30 jours, heures optimales, formats, hooks. Actionnable immédiatement." 
          />
        </div>
      </section>

      {/* ────────────────── SECTION 7: PRICING ────────────────── */}
      <section className="py-24 px-6 border-t border-[#18181b]">
        <h2 className="text-center text-[28px] font-light mb-16 tracking-tight">Tarification transparente</h2>
        <div className="max-w-[800px] mx-auto grid md:grid-cols-2 gap-6 items-stretch">
          
          {/* FREE CARD */}
          <div className="border border-[#27272a] bg-[#111113]/30 rounded-[12px] p-10 flex flex-col justify-between transition-transform hover:scale-[1.01]">
            <div>
               <div className="flex justify-between items-start mb-6">
                 <h3 className="text-[13px] font-medium text-[#52525b]" style={STYLE.fontMono}>GRATUIT</h3>
                 <span className="text-[20px] font-light">0€<span className="text-[12px] text-[#3f3f46]">/mois</span></span>
               </div>
               <ul className="space-y-4 mb-10">
                 <PricingFeature text="3 analyses / mois" />
                 <PricingFeature text="7 plateformes" />
                 <PricingFeature text="Stratégie 30 jours" />
                 <PricingFeature text="Historique 7 jours" />
               </ul>
            </div>
            <Link 
              href="/login" 
              className="w-full text-center py-3 border border-[#27272a] rounded-[8px] text-[13px] hover:bg-[#1c1c1f] transition-colors"
            >
              Commencer →
            </Link>
          </div>

          {/* PRO CARD */}
          <div className="border-2 border-[#22c55e] bg-[#09090b] rounded-[12px] p-10 flex flex-col justify-between relative shadow-[0_0_40px_rgba(34,197,94,0.1)] transition-transform hover:scale-[1.01]">
            <div className="absolute top-0 right-10 -translate-y-1/2">
               <span className="bg-[#22c55e] text-[#09090b] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Populaire</span>
            </div>
            <div>
               <div className="flex justify-between items-start mb-6">
                 <h3 className="text-[13px] font-medium text-[#22c55e]" style={STYLE.fontMono}>PRO</h3>
                 <span className="text-[20px] font-light text-[#fafafa]">9€<span className="text-[12px] text-[#3f3f46]">/mois</span></span>
               </div>
               <ul className="space-y-4 mb-10">
                 <PricingFeature text="Analyses illimitées" highlight />
                 <PricingFeature text="Veille algo en temps réel" highlight />
                 <PricingFeature text="Notifications changements algo" highlight />
                 <PricingFeature text="Export stratégies PDF" highlight />
                 <PricingFeature text="Historique illimité" highlight />
               </ul>
            </div>
            <Link 
              href="/login" 
              className="w-full text-center py-3 bg-[#22c55e] text-[#09090b] rounded-[8px] text-[13.5px] font-medium hover:bg-[#22c55e]/90 transition-all active:scale-95"
            >
              Passer Pro →
            </Link>
          </div>
        </div>
        <p className="text-center mt-10 text-[11px] text-[#3f3f46] uppercase tracking-wider" style={STYLE.fontMono}>
          Paiement sécurisé par Stripe · Résiliable à tout moment
        </p>
      </section>

      {/* ────────────────── SECTION 8: CTA FINAL ────────────────── */}
      <section className="relative py-24 px-6 bg-[#0d0d10] border-t border-[#18181b] overflow-hidden">
         {/* Background Grid */}
         <div 
          className="absolute inset-0 pointer-events-none opacity-[0.2]"
          style={{
            backgroundImage: `linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
        <div className="relative z-10 text-center space-y-8">
          <h2 className="text-[32px] md:text-[36px] font-light tracking-tight">Prêt à décoder l'algorithme ?</h2>
          <p className="text-[#52525b] text-[16px] max-w-[500px] mx-auto">Rejoignez les créateurs qui comprennent les règles du jeu.</p>
          <Link 
              href="/login"
              className="inline-block bg-[#22c55e] text-[#09090b] px-10 py-4 rounded-[8px] text-[14.5px] font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
          >
            Commencer gratuitement →
          </Link>
        </div>
      </section>

      {/* ────────────────── SECTION 9: FOOTER ────────────────── */}
      <footer className="py-10 px-10 flex flex-col md:flex-row justify-between items-center border-t border-[#18181b] bg-[#09090b]">
        <div className="flex items-center space-x-2.5 mb-6 md:mb-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
          <div className="w-[20px] h-[20px] bg-[#22c55e] rounded-[5px] flex items-center justify-center">
            <span className="text-white font-semibold text-[8px]">AL</span>
          </div>
          <span className="text-[12px] text-[#fafafa]">© 2026 AlgoLens</span>
        </div>
        <div className="text-[11px] text-[#27272a] uppercase tracking-widest text-center" style={STYLE.fontMono}>
          Propulsé par Claude 3.5 Sonnet · Hébergé sur Vercel
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ──

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 text-center bg-transparent">
      <div className="text-[26px] font-medium text-[#fafafa] mb-1.5 tracking-tight">{value}</div>
      <div style={STYLE.fontMono} className="text-[10px] text-[#3f3f46] uppercase tracking-[.08em] whitespace-nowrap">{label}</div>
    </div>
  );
}

function StepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex flex-col space-y-5 group">
      <div style={STYLE.fontMono} className="text-[11px] text-[#22c55e] font-medium tracking-widest group-hover:translate-x-1 transition-transform">{num}</div>
      <h3 className="text-[15px] font-medium text-[#fafafa] leading-tight">{title}</h3>
      <p className="text-[13px] text-[#52525b] leading-relaxed">{desc}</p>
    </div>
  );
}

function PricingFeature({ text, highlight = false }: { text: string, highlight?: boolean }) {
  return (
    <li className="flex items-center space-x-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={highlight ? "#22c55e" : "#27272a"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-[13px] text-[#71717a]">{text}</span>
    </li>
  );
}
