// ── Supabase service-role client ───────────────────────────────────────────
// Use ONLY in server-side code (API routes, webhooks).
// Never expose SUPABASE_SERVICE_ROLE_KEY to the client.

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
