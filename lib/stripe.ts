import Stripe from "stripe";

// Lazy singleton — ne s'initialise qu'à l'appel, pas au build
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

// Alias pour la compatibilité avec le code existant
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ── Plan configuration ─────────────────────────────────────────────────────
export const PLAN_CONFIG = {
  free: {
    name: "Free",
    price: 0,
    priceLabel: "Gratuit",
    analyses: 3,
    compare: false,
    veille: false,
    color: "var(--text-muted)",
  },
  pro: {
    name: "Pro",
    price: 9,
    priceLabel: "9€/mois",
    analyses: Infinity,
    compare: true,
    veille: true,
    color: "#a78bfa",
  },
  student: {
    name: "Étudiant",
    price: 15,
    priceLabel: "15€ pour 2 mois",
    analyses: Infinity,
    compare: true,
    veille: true,
    color: "#34d399",
  },
} as const;

// ── Student email validation ────────────────────────────────────────────────
export function isStudentEmail(email: string): boolean {
  const patterns = [
    /\.edu$/i,
    /\.ac\.[a-z]{2,4}$/i,       // .ac.fr, .ac.uk, .ac.be...
    /\.etu\./i,                   // etu.univ-paris.fr
    /\.univ-/i,                   // univ-paris.fr
    /@.*\.univ\./i,
    /\.(u-[a-z]+|uphf|insa|ens|mines)\./i,  // grandes écoles FR
  ];
  return patterns.some((p) => p.test(email));
}
