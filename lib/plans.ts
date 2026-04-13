// ── AlgoLens — Plan gating helpers ────────────────────────────────────────
// Server-side only. Import only in API routes.

import { createClient } from "./supabase/server";

export type PlanType = "free" | "pro" | "student";

export interface UserPlanInfo {
  plan: PlanType;
  isActive: boolean;       // false if student plan expired
  expiresAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  studentUsed: boolean;
}

// ── Get user plan from Supabase ────────────────────────────────────────────
export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("plan, expires_at, stripe_customer_id, stripe_subscription_id, student_used")
    .eq("id", userId)
    .single();

  if (!data) {
    return {
      plan: "free", isActive: true, expiresAt: null,
      stripeCustomerId: null, stripeSubscriptionId: null, studentUsed: false,
    };
  }

  let plan = data.plan as PlanType;
  let isActive = true;

  // Check student expiry
  if (plan === "student" && data.expires_at) {
    if (new Date(data.expires_at) < new Date()) {
      plan = "free";
      isActive = false;
      // Downgrade in DB via SECURITY DEFINER RPC (works with anon key)
      await supabase.rpc("downgrade_to_free_by_user", { p_user_id: userId });
    }
  }

  return {
    plan,
    isActive,
    expiresAt: data.expires_at ?? null,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
    studentUsed: data.student_used ?? false,
  };
}

// ── Get current user from session ─────────────────────────────────────────
export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Check analyse limit (Free = 3/month) ──────────────────────────────────
export async function checkAnalysisLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const { plan } = await getUserPlan(userId);

  if (plan !== "free") return { allowed: true, used: 0, limit: Infinity };

  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("analysis_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  const used = count ?? 0;
  return { allowed: used < 3, used, limit: 3 };
}
