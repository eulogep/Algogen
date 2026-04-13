import { NextResponse } from "next/server";
import { getStripe, isStudentEmail } from "@/lib/stripe";
import { getSessionUser, getUserPlan } from "@/lib/plans";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { plan } = await request.json() as { plan: "pro" | "student" };

  if (!["pro", "student"].includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  // ── Validation étudiant ──────────────────────────────────────────────
  if (plan === "student") {
    if (!isStudentEmail(user.email ?? "")) {
      return NextResponse.json(
        { error: "Email universitaire requis (.edu, .ac.fr, .univ-*, .etu.*)" },
        { status: 403 }
      );
    }
    const { studentUsed } = await getUserPlan(user.id);
    if (studentUsed) {
      return NextResponse.json(
        { error: "L'offre étudiante est limitée à 1 utilisation par compte." },
        { status: 403 }
      );
    }
  }

  const stripe = getStripe();
  const supabase = getSupabase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://algolens-five.vercel.app";

  // ── Récupérer ou créer le Stripe customer ────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.rpc("set_stripe_customer", {
      p_user_id: user.id,
      p_customer_id: customerId,
    });
  }

  // ── Créer la session Stripe Checkout ────────────────────────────────
  const priceId = plan === "pro"
    ? process.env.STRIPE_PRO_PRICE_ID!
    : process.env.STRIPE_STUDENT_PRICE_ID!;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: plan === "pro" ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?success=1&plan=${plan}`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    metadata: { supabase_user_id: user.id, plan },
    ...(plan === "pro" && {
      subscription_data: { metadata: { supabase_user_id: user.id } },
    }),
  });

  return NextResponse.json({ url: session.url });
}
