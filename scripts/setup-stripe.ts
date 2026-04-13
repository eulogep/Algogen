/**
 * AlgoLens — Stripe product setup
 * Run once: npx tsx scripts/setup-stripe.ts
 * Outputs the price IDs to add in .env.local
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("❌ STRIPE_SECRET_KEY manquant dans .env.local");
  process.exit(1);
}

const stripe = new Stripe(key, { typescript: true });

async function main() {
  console.log("🔧 Création des produits Stripe AlgoLens...\n");

  // ── Pro : abonnement mensuel 9€ ──────────────────────────────────────
  const proProduct = await stripe.products.create({
    name: "AlgoLens Pro",
    description: "Analyses illimitées, comparaison multi-plateformes, veille algorithmique",
    metadata: { plan: "pro" },
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 900,       // 9.00€ en centimes
    currency: "eur",
    recurring: { interval: "month" },
    lookup_key: "algolens_pro_monthly",
  });

  console.log(`✅ Pro créé : ${proProduct.name}`);
  console.log(`   Price ID : ${proPrice.id}\n`);

  // ── Étudiant : paiement unique 15€ pour 2 mois ───────────────────────
  const studentProduct = await stripe.products.create({
    name: "AlgoLens Étudiant",
    description: "Accès Pro pendant 2 mois — offre réservée aux étudiants",
    metadata: { plan: "student" },
  });

  const studentPrice = await stripe.prices.create({
    product: studentProduct.id,
    unit_amount: 1500,      // 15.00€ en centimes
    currency: "eur",
    lookup_key: "algolens_student_2months",
  });

  console.log(`✅ Étudiant créé : ${studentProduct.name}`);
  console.log(`   Price ID : ${studentPrice.id}\n`);

  // ── Résumé ───────────────────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Ajoute ces lignes dans .env.local :");
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
  console.log(`STRIPE_STUDENT_PRICE_ID=${studentPrice.id}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
