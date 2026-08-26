import React from "react";
import Link from "next/link";
import LandingNavbar from "./components/LandingNavbar";

const STYLE = {
  fontInter: { fontFamily: "'Inter', sans-serif" },
  fontMono: { fontFamily: "'JetBrains Mono', monospace" },
};

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#09090b] text-[#fafafa] selection:bg-[#22c55e]/30"
      style={STYLE.fontInter}
    >
      <LandingNavbar />

      <section className="relative overflow-hidden border-b border-[#18181b] pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-32 lg:pb-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="pointer-events-none absolute top-[-160px] left-1/2 h-[420px] w-[680px] -translate-x-1/2 opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, #22c55e 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div className={`${CONTAINER} relative z-10`}>
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="mb-6 inline-flex items-center rounded-full border border-[#27272a] bg-[#111113] px-3 py-1 sm:mb-8"
              style={STYLE.fontMono}
            >
              <span className="text-[10px] uppercase tracking-wider text-[#22c55e] sm:text-[11px]">
                Veille algorithmique · 7 plateformes
              </span>
            </div>

            <h1 className="mb-6 text-4xl font-light leading-[1.04] tracking-tight sm:text-5xl lg:mb-8 lg:text-6xl xl:text-7xl">
              Comprendre <span className="font-medium text-[#fafafa]">l&apos;algorithme</span>.
              <br />
              Dominer le <span className="font-medium text-[#fafafa]">reach</span>.
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-[#71717a] sm:mb-10 sm:text-lg lg:text-xl">
              AlgoLens analyse les signaux cachés des plateformes et génère une stratégie de contenu sur-mesure en 3 secondes.
            </p>

            <div className="flex flex-col items-center gap-4">
              <Link
                href="/login"
                className="group relative rounded-[8px] bg-[#22c55e] px-8 py-3.5 text-sm font-medium text-[#09090b] shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all hover:scale-[1.02] active:scale-95 sm:px-10 sm:py-4"
              >
                Commencer gratuitement →
              </Link>
              <span style={STYLE.fontMono} className="text-[10px] text-[#52525b] sm:text-[11px]">
                3 analyses offertes · Sans carte bancaire
              </span>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
            <div className="mb-6 text-center sm:mb-8">
              <p style={STYLE.fontMono} className="mb-3 text-[10px] uppercase tracking-[0.14em] text-[#22c55e] sm:text-[11px]">
                Aperçu produit
              </p>
              <h2 className="text-2xl font-light tracking-tight text-[#fafafa] sm:text-3xl lg:text-4xl">
                Votre stratégie en 3 secondes
              </h2>
            </div>

            <div className="overflow-hidden rounded-[12px] border border-[#27272a] bg-[#09090b] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#27272a] bg-[#111113] px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22c55e] animate-pulse" />
                  <span style={STYLE.fontMono} className="truncate text-[10px] text-[#a1a1aa] sm:text-[11px]">
                    AlgoLens · TikTok FYP
                  </span>
                </div>
                <div className="ml-4 flex shrink-0 gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#1c1c1f]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#1c1c1f]" />
                </div>
              </div>

              <div className="grid gap-7 p-5 sm:gap-8 sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-10">
                <div>
                  <h3 className="mb-2 text-xs font-medium text-[#22c55e] sm:text-[13px]" style={STYLE.fontMono}>
                    📅 Semaine 1 — Hook & Découverte
                  </h3>
                  <p className="text-sm leading-relaxed text-[#a1a1aa] sm:text-[15px]">
                    Publiez 5x/semaine entre 18h-20h. Durée optimale : 23-27 secondes. Hook dans les 1.5 premières secondes. Utilisez le son trending #1 pour booster la rétention initiale.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-medium text-[#22c55e] sm:text-[13px]" style={STYLE.fontMono}>
                    📈 Métrique clé : Audio Watchtime
                  </h3>
                  <p className="text-sm leading-relaxed text-[#a1a1aa] sm:text-[15px]">
                    L&apos;algorithme v4 privilégie les vidéos dont l&apos;audio est écouté jusqu&apos;au bout. Intégrez des sous-titres dynamiques pour forcer l&apos;engagement visuel.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-[#18181b] px-5 py-4 text-[10px] text-[#52525b] sm:flex-row sm:items-center sm:justify-between sm:px-8" style={STYLE.fontMono}>
                <span>Généré en 2.3s · Cache L1</span>
                <span>TikTok FYP Algorithm v4</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#18181b] bg-[#111113] py-8 sm:py-10">
        <div className={CONTAINER}>
          <div className="grid grid-cols-2 divide-x divide-y divide-[#27272a] overflow-hidden rounded-[12px] border border-[#27272a] lg:grid-cols-4 lg:divide-y-0">
            <StatItem value="93%" label="réduction coûts API" />
            <StatItem value="<1ms" label="réponse cache L1" />
            <StatItem value="7" label="plateformes couvertes" />
            <StatItem value="30j" label="plan d&apos;action généré" />
          </div>
        </div>
      </section>

      <section className="border-b border-[#18181b] py-20 sm:py-24 lg:py-28">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-3xl text-center">
            <p style={STYLE.fontMono} className="mb-3 text-[10px] uppercase tracking-[0.14em] text-[#22c55e] sm:text-[11px]">
              Couverture native
            </p>
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl lg:text-4xl">
              7 algorithmes décryptés
            </h2>
          </div>
          <div className="mx-auto mt-10 flex max-w-5xl flex-wrap justify-center gap-2.5 sm:mt-12 sm:gap-3">
            {["TikTok", "Instagram Reels", "Instagram Feed", "YouTube Shorts", "YouTube Long", "LinkedIn", "X/Twitter"].map((platform) => (
              <div
                key={platform}
                className="cursor-default rounded-full border border-[#27272a] px-4 py-2.5 text-xs text-[#71717a] transition-all hover:border-[#22c55e] hover:text-[#fafafa] sm:px-5 sm:text-[13px]"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#18181b] py-20 sm:py-24 lg:py-28">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-3xl text-center">
            <p style={STYLE.fontMono} className="mb-3 text-[10px] uppercase tracking-[0.14em] text-[#22c55e] sm:text-[11px]">
              Processus
            </p>
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl lg:text-4xl">Simple par design</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3 lg:gap-6">
            <StepItem num="01" title="Décrivez votre profil" desc="Niche, type de contenu, audience cible, objectif. 30 secondes seulement." />
            <StepItem num="02" title="L&apos;IA analyse l&apos;algorithme" desc="Claude 3.5 Sonnet croise votre profil avec les signaux temps réel de la plateforme." />
            <StepItem num="03" title="Recevez votre stratégie" desc="Plan 30 jours, heures optimales, formats, hooks. Actionnable immédiatement." />
          </div>
        </div>
      </section>

      <section className="border-b border-[#18181b] py-20 sm:py-24 lg:py-28">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-3xl text-center">
            <p style={STYLE.fontMono} className="mb-3 text-[10px] uppercase tracking-[0.14em] text-[#22c55e] sm:text-[11px]">
              Accès
            </p>
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl lg:text-4xl">Tarification transparente</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl items-stretch justify-items-center gap-6 md:mt-14 md:grid-cols-2">
            <PricingCard kind="free" />
            <PricingCard kind="pro" />
          </div>
          <p className="mt-8 text-center text-[10px] uppercase tracking-wider text-[#52525b] sm:mt-10 sm:text-[11px]" style={STYLE.fontMono}>
            Paiement sécurisé par Stripe · Résiliable à tout moment
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0d0d10] py-20 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className={`${CONTAINER} relative z-10 text-center`}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl">Prêt à décoder l&apos;algorithme ?</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#71717a] sm:text-lg">
              Rejoignez les créateurs qui comprennent les règles du jeu.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block rounded-[8px] bg-[#22c55e] px-8 py-3.5 text-sm font-medium text-[#09090b] shadow-[0_0_20px_rgba(34,197,94,0.15)] transition-all hover:scale-[1.02] active:scale-95 sm:px-10 sm:py-4"
            >
              Commencer gratuitement →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#18181b] bg-[#09090b] py-8 sm:py-10">
        <div className={`${CONTAINER} flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left`}>
          <div className="flex items-center gap-2.5 grayscale opacity-50 transition-all hover:grayscale-0 hover:opacity-100">
            <div className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#22c55e]">
              <span className="text-[8px] font-semibold text-white">AL</span>
            </div>
            <span className="text-xs text-[#fafafa]">© 2026 AlgoLens</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-[#52525b] sm:text-[11px]" style={STYLE.fontMono}>
            Propulsé par Claude 3.5 Sonnet · Hébergé sur Vercel
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center px-4 py-5 text-center sm:px-6">
      <div className="mb-1 text-2xl font-medium tracking-tight text-[#fafafa] sm:text-3xl">{value}</div>
      <div style={STYLE.fontMono} className="text-[9px] uppercase tracking-[0.08em] text-[#71717a] sm:text-[10px]">
        {label}
      </div>
    </div>
  );
}

function StepItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="group flex h-full flex-col rounded-[12px] border border-[#27272a] bg-[#111113]/30 p-6 transition-colors hover:border-[#3f3f46] sm:p-8">
      <div style={STYLE.fontMono} className="mb-8 text-[11px] font-medium tracking-widest text-[#22c55e] transition-transform group-hover:translate-x-1">
        {num}
      </div>
      <h3 className="text-base font-medium leading-tight text-[#fafafa] sm:text-lg">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-[#71717a] sm:text-[15px]">{desc}</p>
    </div>
  );
}

function PricingCard({ kind }: { kind: "free" | "pro" }) {
  const isPro = kind === "pro";
  const features = isPro
    ? ["Analyses illimitées", "Veille algo en temps réel", "Notifications changements algo", "Export stratégies PDF", "Historique illimité"]
    : ["3 analyses / mois", "7 plateformes", "Stratégie 30 jours", "Historique 7 jours"];

  return (
    <div
      className={`relative flex h-full w-full max-w-md flex-col justify-between rounded-[12px] p-7 transition-transform hover:scale-[1.01] sm:p-9 ${
        isPro
          ? "border-2 border-[#22c55e] bg-[#09090b] shadow-[0_0_40px_rgba(34,197,94,0.1)]"
          : "border border-[#27272a] bg-[#111113]/30"
      }`}
    >
      {isPro && (
        <div className="absolute right-6 top-0 -translate-y-1/2 sm:right-8">
          <span className="rounded-full bg-[#22c55e] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#09090b]">Populaire</span>
        </div>
      )}
      <div>
        <div className="mb-7 flex items-start justify-between">
          <h3 className={`text-[13px] font-medium ${isPro ? "text-[#22c55e]" : "text-[#a1a1aa]"}`} style={STYLE.fontMono}>
            {isPro ? "PRO" : "GRATUIT"}
          </h3>
          <span className="text-2xl font-light text-[#fafafa]">
            {isPro ? "9€" : "0€"}
            <span className="text-xs text-[#52525b]">/mois</span>
          </span>
        </div>
        <ul className="mb-10 space-y-4">
          {features.map((feature) => (
            <PricingFeature key={feature} text={feature} highlight={isPro} />
          ))}
        </ul>
      </div>
      <Link
        href="/login"
        className={`w-full rounded-[8px] py-3 text-center text-sm transition-all active:scale-95 ${
          isPro
            ? "bg-[#22c55e] font-medium text-[#09090b] hover:bg-[#22c55e]/90"
            : "border border-[#27272a] text-[#fafafa] hover:bg-[#1c1c1f]"
        }`}
      >
        {isPro ? "Passer Pro →" : "Commencer →"}
      </Link>
    </div>
  );
}

function PricingFeature({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={highlight ? "#22c55e" : "#52525b"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-sm text-[#a1a1aa]">{text}</span>
    </li>
  );
}
