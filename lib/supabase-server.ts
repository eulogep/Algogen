// lib/supabase-server.ts
// Thin helper that wraps the existing createClient() for use in layouts and pages.

import { createClient } from "./supabase/server";

export { createClient as createServerSupabaseClient };

export async function getUser() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
