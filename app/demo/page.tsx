"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import LandingNavbar from "../components/LandingNavbar";

type PlatformId = "tiktok" | "instagram" | "youtube";
type ObjectiveId = "reach" | "engagement" | "conversion";

const PLATFORM_OPTIONS: Array<{ id: PlatformId; label: string; detail: string; accent: string }> = [
  { id: "tiktok", label: "TikTok", detail: "Découverte rapide", accent: "#22c55e" },
  { id: "instagram", label: "Instagram Reels", detail: "Communauté & rétention", accent: "#f472b6" },
  { id: "youtube", label: "YouTube Shorts", detail: "Intention & durée", accent: "#f87171" },
];

const OBJECTIVES: Array<{ id: ObjectiveId; label: string }> = [
  { id: "reach", label: "Gagner en portée" },
  { id: "engagement", label: "Créer plus d’engagement" },
  { id: "conversion", label: "Transformer l’attention" },
];

const OBJECTIVE_COPY: Record<ObjectiveId, { focus: string; action: string }> = {
  reach: {
    focus: "la vitesse de découverte et le taux de complétion",
    action: "Ouvrez par un résultat concret avant de nommer votre méthode.",
  },
  engagement: {
    focus: "les signaux de conversation utiles",
    action: "Terminez par une question binaire, simple à commenter en moins de cinq secondes.",
  },
  conversion: {
    focus: "la continuité entre promesse, preuve et prochaine étape",
    action: "Montrez une preuve mesurable avant votre appel à l’action, puis gardez une seule destination.",
  },
};

const STYLE = {
  fontMono: { fontFamily: "'JetBrains Mono', monospace" },
};

export default function DemoPage() {
  const [platform, setPlatform] = useState<PlatformId>("tiktok");
  const [niche, setNiche] = useState("Création de contenu B2B");
  const [objective, setObjective] = useState<ObjectiveId>("reach");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const selectedPlatform = useMemo(
    () => PLATFORM_OPTIONS.find((item) => item.id === platform) ?? PLATFORM_OPTIONS[0],
    [platform]
  );
  const objectiveCopy = OBJECTIVE_COPY[objective];

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setHasResult(false);
    window.setTimeout(() => {
      setIsGenerating(false);
      setHasResult(true);
    }, 850);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#09090b] text-[#fafafa] selection:bg-[#22c55e]/30">
      <LandingNavbar />

      <section className="relative overflow-hidden border-b border-[#18181b] pb-16 pt-16 sm:pb-20 sm:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-[#245c36] bg-[#0d1d12] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#86efac]" style={STYLE.fontMono}>
              Démonstration interactive
            </p>
            <h1 className="text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl">
              Voyez une stratégie prendre forme.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a1a1aa] sm:text-lg">
              Testez le type de recommandations qu&apos;AlgoLens structure pour un créateur. Cette démo utilise un scénario pédagogique local : aucune requête IA ni donnée personnelle n&apos;est envoyée.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-5 lg:mt-14 lg:grid-cols-[0.82fr_1.18fr]">
            <form onSubmit={handleGenerate} className="rounded-2xl border border-[#27272a] bg-[#111113] p-5 shadow-2xl sm:p-7">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-5">
                <div>
                  <p className="text-sm font-medium">Votre scénario</p>
                  <p className="mt-1 text-xs text-[#71717a]">3 paramètres, moins d&apos;une minute.</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22c55e] text-xs font-bold text-[#09090b]">01</span>
              </div>

              <fieldset className="mt-6">
                <legend className="text-xs font-medium text-[#d4d4d8]">Plateforme cible</legend>
                <div className="mt-3 grid gap-2">
                  {PLATFORM_OPTIONS.map((item) => {
                    const isSelected = item.id === platform;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPlatform(item.id)}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                          isSelected ? "border-[#22c55e] bg-[#0d1d12]" : "border-[#27272a] bg-[#09090b] hover:border-[#3f3f46]"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span className="text-sm font-medium text-[#fafafa]">{item.label}</span>
                        <span className="text-[11px] text-[#71717a]">{item.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="mt-6 block text-xs font-medium text-[#d4d4d8]" htmlFor="demo-niche">
                Votre angle éditorial
                <input
                  id="demo-niche"
                  value={niche}
                  maxLength={70}
                  onChange={(event) => setNiche(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-[#27272a] bg-[#09090b] px-4 py-3 text-sm text-[#fafafa] outline-none transition focus:border-[#22c55e]"
                  placeholder="Ex. pédagogie finance personnelle"
                />
              </label>

              <fieldset className="mt-6">
                <legend className="text-xs font-medium text-[#d4d4d8]">Objectif prioritaire</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {OBJECTIVES.map((item) => (
                    <label
                      key={item.id}
                      className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-xs transition ${
                        objective === item.id ? "border-[#22c55e] bg-[#0d1d12] text-[#86efac]" : "border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="objective"
                        value={item.id}
                        checked={objective === item.id}
                        onChange={() => setObjective(item.id)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isGenerating}
                className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#22c55e] px-4 py-3.5 text-sm font-semibold text-[#09090b] transition hover:bg-[#86efac] disabled:cursor-wait disabled:opacity-70"
              >
                {isGenerating ? "Préparation de la recommandation…" : "Générer un aperçu"}
              </button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-[#52525b]" style={STYLE.fontMono}>
                Démo pédagogique — sans appel à votre compte ni à une API.
              </p>
            </form>

            <section className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#09090b] shadow-2xl" aria-live="polite">
              <div className="flex items-center justify-between border-b border-[#27272a] bg-[#111113] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${isGenerating ? "animate-pulse bg-amber-300" : "bg-[#22c55e]"}`} />
                  <span className="text-xs text-[#d4d4d8]" style={STYLE.fontMono}>AlgoLens · aperçu stratégique</span>
                </div>
                <span className="rounded-full border border-[#27272a] px-2.5 py-1 text-[10px] text-[#71717a]" style={STYLE.fontMono}>DEMO</span>
              </div>

              <div className="min-h-[540px] p-5 sm:p-7">
                {!hasResult && !isGenerating && <EmptyResult />}
                {isGenerating && <LoadingResult />}
                {hasResult && (
                  <div className="animate-[fadeUp_0.35s_ease-out]">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#18181b] pb-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#86efac]" style={STYLE.fontMono}>Priorité de la semaine</p>
                        <h2 className="mt-2 text-2xl font-light sm:text-3xl">{selectedPlatform.label}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">Angle : <span className="text-[#fafafa]">{niche.trim() || "votre angle éditorial"}</span></p>
                      </div>
                      <div className="rounded-xl border border-[#245c36] bg-[#0d1d12] px-4 py-3 text-right">
                        <p className="text-[10px] uppercase tracking-wider text-[#86efac]" style={STYLE.fontMono}>Signal à optimiser</p>
                        <p className="mt-1 text-sm font-medium text-[#fafafa]">{objectiveCopy.focus}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <Metric label="Format" value={platform === "youtube" ? "35–55 sec" : "18–30 sec"} />
                      <Metric label="Cadence" value={platform === "instagram" ? "3 Reels / sem." : "4 posts / sem."} />
                      <Metric label="Premier test" value="72 heures" />
                    </div>

                    <div className="mt-6 rounded-xl border border-[#27272a] bg-[#111113] p-5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#86efac]" style={STYLE.fontMono}>Recommandation actionnable</p>
                      <p className="mt-3 text-base leading-relaxed text-[#e4e4e7]">{objectiveCopy.action}</p>
                      <div className="mt-5 rounded-lg border-l-2 border-[#22c55e] bg-[#09090b] px-4 py-3 text-sm leading-relaxed text-[#a1a1aa]">
                        Hook suggéré : <span className="text-[#fafafa]">« La plupart des créateurs compliquent ceci. Voici l&apos;étape que je garde quand le temps manque. »</span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <InsightCard title="Indicateur à lire" value={platform === "instagram" ? "Partages par portée" : "Rétention à 3 secondes"} description="Comparez ce signal entre deux variantes du même sujet, à cadence comparable." />
                      <InsightCard title="Prochaine expérience" value="Deux ouvertures, une promesse" description="Gardez le format et l&apos;heure constants ; ne testez qu&apos;une variable à la fois." />
                    </div>

                    <div className="mt-7 flex flex-col items-start justify-between gap-4 border-t border-[#18181b] pt-6 sm:flex-row sm:items-center">
                      <p className="max-w-md text-xs leading-relaxed text-[#71717a]">Cet aperçu illustre la structure d&apos;une stratégie. Une analyse complète combine votre profil, la plateforme choisie et les signaux disponibles.</p>
                      <Link href={`/analyze/${platform}`} className="shrink-0 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-[#09090b] transition hover:bg-[#86efac]">
                        Lancer mon analyse →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="border-b border-[#18181b] bg-[#111113] py-14 sm:py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          <Benefit title="Clair" description="Une recommandation hiérarchisée, avec les signaux à regarder en premier." />
          <Benefit title="Actionnable" description="Des formats, tests et métriques formulés pour la prochaine publication." />
          <Benefit title="Transparent" description="Des sources et limites visibles lorsque l’analyse s’appuie sur la veille." />
        </div>
      </section>
    </main>
  );
}

function EmptyResult() {
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#245c36] bg-[#0d1d12] text-lg font-semibold text-[#86efac]">AL</div>
      <h2 className="mt-5 text-xl font-light text-[#fafafa]">Votre aperçu est prêt à être composé.</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#71717a]">Choisissez une plateforme et un objectif, puis générez un scénario de stratégie représentatif.</p>
    </div>
  );
}

function LoadingResult() {
  return (
    <div className="flex min-h-[480px] flex-col justify-center">
      <div className="space-y-5">
        <div className="h-3 w-28 animate-pulse rounded bg-[#245c36]" />
        <div className="h-9 w-3/5 animate-pulse rounded bg-[#1c1c1f]" />
        <div className="h-20 animate-pulse rounded-xl border border-[#27272a] bg-[#111113]" />
        <div className="grid gap-3 sm:grid-cols-2"><div className="h-28 animate-pulse rounded-xl border border-[#27272a] bg-[#111113]" /><div className="h-28 animate-pulse rounded-xl border border-[#27272a] bg-[#111113]" /></div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#111113] p-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#71717a]" style={STYLE.fontMono}>{label}</p>
      <p className="mt-2 text-sm font-medium text-[#fafafa]">{value}</p>
    </div>
  );
}

function InsightCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-xl border border-[#27272a] p-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#71717a]" style={STYLE.fontMono}>{title}</p>
      <p className="mt-2 text-sm font-medium text-[#fafafa]">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-[#71717a]">{description}</p>
    </div>
  );
}

function Benefit({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#09090b] p-5">
      <p className="text-sm font-medium text-[#86efac]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#71717a]">{description}</p>
    </div>
  );
}
