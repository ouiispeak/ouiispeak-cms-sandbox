/**
 * Admin Supabase client for scripts that need to bypass RLS.
 * Uses SUPABASE_SERVICE_ROLE_KEY when set; otherwise returns null.
 *
 * Add to .env.local (never commit):
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *
 * Find it: Supabase Dashboard → Settings → API → service_role (secret)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient !== null) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey?.trim()) return null;

  adminClient = createClient(url, serviceKey.trim(), {
    auth: { persistSession: false },
  });
  return adminClient;
}
