import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Кліент з service role для серверных admin API пасля праверкі is_admin.
 * Абыходзіць PostgREST без JWT (anon) і абмежаванні RLS на мутацыях.
 * Калі ключа няма (лакальна), вяртаецца user-scoped кліент.
 */
export function getAdminDatabaseClient(userScopedClient: SupabaseClient): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return userScopedClient;
}
