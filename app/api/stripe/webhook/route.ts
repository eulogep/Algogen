import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacySubscription = (
    invoice as unknown as {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;

  if (typeof legacySubscription === "string") return legacySubscription;
  if (legacySubscription && typeof legacySubscription === "object") return legacySubscription.id;

  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSubscription === "string") return parentSubscription;
  if (parentSubscription && typeof parentSubscription === "object") return parentSubscription.id;

  return null;
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

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan as "pro" | "student" | undefined;
        if (!userId || !plan) break;

        if (plan === "pro") {
          const { error } = await supabase.rpc("activate_pro_plan", {
            p_user_id: userId,
            p_subscription: session.subscription as string,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.rpc("activate_student_plan", {
            p_user_id: userId,
          });
          if (error) throw error;
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        const { error } = userId
          ? await supabase.rpc("downgrade_to_free_by_user", { p_user_id: userId })
          : await supabase.rpc("downgrade_to_free_by_customer", {
              p_customer_id: subscription.customer as string,
            });
        if (error) throw error;
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (invoice.billing_reason !== "subscription_cycle" || !subscriptionId) break;

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        const { error } = await supabase.rpc("activate_pro_plan", {
          p_user_id: userId,
          p_subscription: subscription.id,
        });
        if (error) throw error;
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const { error } = await supabase.rpc("downgrade_to_free_by_customer", {
          p_customer_id: invoice.customer as string,
        });
        if (error) throw error;
        break;
      }
    }
  } catch (err) {
    console.error("Stripe billing synchronization failed:", {
      eventId: event.id,
      eventType: event.type,
      err,
    });
    return NextResponse.json(
      { error: "Billing synchronization failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
