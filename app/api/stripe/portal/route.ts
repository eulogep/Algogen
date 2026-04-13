import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSessionUser } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    return NextResponse.json({ error: "Aucun abonnement trouvé" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://algolens-five.vercel.app";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
