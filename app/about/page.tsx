import Link from "next/link";
import LandingNavbar from "../components/LandingNavbar";

const STYLE = {
  fontMono: { fontFamily: "'JetBrains Mono', monospace" },
};

const PRINCIPLES = [
  {
    number: "01",
    title: "Rendre les signaux lisibles",
    description:
      "Les plateformes évoluent vite. AlgoLens transforme les éléments utiles — formats, rétention, cadence, engagement et contexte éditorial — en priorités compréhensibles.",
  },
  {
    number: "02",
    title: "Préserver le jugement du créateur",
    description:
      "Une recommandation n’est pas un pilote automatique. Elle est conçue comme une hypothèse de travail à adapter à votre audience, votre voix et vos objectifs.",
  },
  {
    number: "03",
    title: "Montrer les limites",
    description:
      "Les contenus, algorithmes et sources changent. Nous séparons les faits observés, les signaux émergents et les conseils à tester pour éviter les promesses absolues.",
  },
];

const WORKFLOW = [
  ["Collecter", "Les newsrooms officielles et les sources configurées apportent le contexte des changements de plateforme."],
  ["Structurer", "Les signaux sont normalisés pour comparer leur provenance, leur fraîcheur et leur niveau de confiance."],
  ["Traduire", "Une analyse relie les éléments pertinents à un profil créateur, un format et un objectif éditorial."],
  ["Expérimenter", "La stratégie met l’accent sur des tests mesurables plutôt que sur des recettes universelles."],
] as const;

export const metadata = {
  title: "À propos — AlgoLens",
  description: "Découvrez la mission, la méthode et les principes de transparence d’AlgoLens.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#09090b] text-[#fafafa] selection:bg-[#22c55e]/30">
      <LandingNavbar />

      <section className="relative overflow-hidden border-b border-[#18181b] pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-240px] h-[520px] w-[760px] -translate-x-1/2 opacity-[0.1]"
          style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#86efac]" style={STYLE.fontMono}>À propos d&apos;AlgoLens</p>
          <div className="mt-6 max-w-4xl">
            <h1 className="text-4xl font-light leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Faire de l&apos;incertitude algorithmique un plan de travail.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-relaxed text-[#a1a1aa] sm:text-lg lg:text-xl">
              AlgoLens est un atelier d&apos;analyse pour les créateurs et équipes éditoriales qui veulent prendre de meilleures décisions sans confondre rumeur, tendance et changement confirmé.
            </p>
          </div>
          <div className="mt-12 grid gap-4 border-t border-[#27272a] pt-6 sm:grid-cols-3">
            <Stat value="7" label="plateformes suivies" />
            <Stat value="1" label="objectif : décider avec contexte" />
            <Stat value="0" label="promesse de croissance garantie" />
          </div>
        </div>
      </section>

      <section className="border-b border-[#18181b] bg-[#111113] py-20 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] lg:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#86efac]" style={STYLE.fontMono}>Notre point de départ</p>
            <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">Les algorithmes ne sont pas une liste d&apos;astuces.</h2>
          </div>
          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-[#a1a1aa]">
            <p>
              Un changement de recommandation, une nouvelle fonctionnalité ou un signal viral ne dit pas automatiquement quoi publier demain. L&apos;interprétation dépend d&apos;une plateforme, d&apos;une audience, d&apos;un format et d&apos;un objectif.
            </p>
            <p>
              AlgoLens met donc l&apos;accent sur une discipline simple : collecter les bons éléments, les qualifier, puis les convertir en expériences de contenu qui peuvent être observées et améliorées.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#18181b] py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#86efac]" style={STYLE.fontMono}>Principes de produit</p>
            <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">Une IA utile doit aussi être explicable.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <article key={principle.number} className="flex min-h-64 flex-col rounded-2xl border border-[#27272a] bg-[#111113]/40 p-6 sm:p-7">
                <p className="text-[11px] tracking-[0.14em] text-[#86efac]" style={STYLE.fontMono}>{principle.number}</p>
                <h3 className="mt-10 text-lg font-medium text-[#fafafa]">{principle.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#71717a]">{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#18181b] bg-[#111113] py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#86efac]" style={STYLE.fontMono}>Méthode</p>
            <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">Du signal à l&apos;expérience mesurable.</h2>
          </div>
          <ol className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2">
            {WORKFLOW.map(([title, description], index) => (
              <li key={title} className="flex gap-4 rounded-xl border border-[#27272a] bg-[#09090b] p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#245c36] bg-[#0d1d12] text-[11px] text-[#86efac]" style={STYLE.fontMono}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-medium text-[#fafafa]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#71717a]">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-[#18181b] py-20 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-2xl border border-[#27272a] bg-[#111113]/40 p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#86efac]" style={STYLE.fontMono}>Provenance</p>
            <h2 className="mt-4 text-2xl font-light tracking-tight">Ce que nous privilégions</h2>
            <p className="mt-5 text-sm leading-relaxed text-[#a1a1aa]">
              Les annonces et newsrooms officielles sont la référence pour les changements confirmés. Les signaux de veille enrichissent le contexte, mais leur provenance et leur niveau de confiance doivent rester visibles.
            </p>
            <Link href="/updates" className="mt-6 inline-flex text-sm font-medium text-[#86efac] transition hover:text-[#fafafa]">Voir l&apos;observatoire →</Link>
          </article>
          <article className="rounded-2xl border border-[#27272a] bg-[#111113]/40 p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#86efac]" style={STYLE.fontMono}>Limites</p>
            <h2 className="mt-4 text-2xl font-light tracking-tight">Ce qu&apos;AlgoLens ne prétend pas faire</h2>
            <p className="mt-5 text-sm leading-relaxed text-[#a1a1aa]">
              Aucun outil ne connaît exactement les règles internes d&apos;une plateforme, ni ne garantit une portée ou des ventes. Les recommandations sont des hypothèses structurées à confronter à vos résultats.
            </p>
            <Link href="/demo" className="mt-6 inline-flex text-sm font-medium text-[#86efac] transition hover:text-[#fafafa]">Essayer la démonstration →</Link>
          </article>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0d0d10] py-20 sm:py-24">
        <div className="mx-auto w-full max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-light tracking-tight sm:text-4xl">Prêt à construire votre prochaine expérience ?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#71717a]">Commencez par explorer le format d&apos;une recommandation, puis passez à une analyse adaptée à votre plateforme.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/demo" className="rounded-xl bg-[#22c55e] px-6 py-3 text-sm font-semibold text-[#09090b] transition hover:bg-[#86efac]">Ouvrir la démo live</Link>
            <Link href="/login" className="rounded-xl border border-[#3f3f46] px-6 py-3 text-sm font-medium text-[#fafafa] transition hover:border-[#71717a] hover:bg-[#111113]">Créer mon espace</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-light tracking-tight text-[#fafafa]">{value}</p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#71717a]" style={STYLE.fontMono}>{label}</p>
    </div>
  );
}
