import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Client Supabase avec clé anon — les RPC sont SECURITY DEFINER
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  switch (event.type) {

    // ── Paiement réussi ────────────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan as "pro" | "student" | undefined;
      if (!userId || !plan) break;

      if (plan === "pro") {
        await supabase.rpc("activate_pro_plan", {
          p_user_id: userId,
          p_subscription: session.subscription as string,
        });
      }
      if (plan === "student") {
        await supabase.rpc("activate_student_plan", { p_user_id: userId });
      }
      break;
    }

    // ── Subscription annulée → Free ────────────────────────────────────
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (userId) {
        await supabase.rpc("downgrade_to_free_by_user", { p_user_id: userId });
      } else {
        await supabase.rpc("downgrade_to_free_by_customer", {
          p_customer_id: sub.customer as string,
        });
      }
      break;
    }

    // ── Renouvellement mensuel Pro ─────────────────────────────────────
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      // SDK v17+: subscription moved to parent.subscription_details.subscription
      const invoiceSubscriptionId =
        (invoice as unknown as Record<string, unknown>).subscription as string | null ??
        (invoice.parent as unknown as Record<string, unknown> | undefined)
          ?.subscription_details as string | null ??
        null;
      if (invoice.billing_reason === "subscription_cycle" && invoiceSubscriptionId) {
        const subs = await getStripe().subscriptions.retrieve(invoiceSubscriptionId);
        const userId = subs.metadata?.supabase_user_id;
        if (userId) {
          await supabase.rpc("activate_pro_plan", {
            p_user_id: userId,
            p_subscription: subs.id,
          });
        }
      }
      break;
    }

    // ── Paiement échoué → Free ─────────────────────────────────────────
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase.rpc("downgrade_to_free_by_customer", {
        p_customer_id: invoice.customer as string,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
