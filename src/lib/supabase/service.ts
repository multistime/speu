import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const serviceClientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
} as const;

/**
 * Толькі service role — для admin API, дзе патрэбны абход RLS (user_roles, auth.admin, …).
 * Без ключа вяртае null (выклікач павінен вярнуць 503 / падказку ў адказе).
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, serviceClientOptions);
}

/**
 * Кліент з service role для серверных admin API пасля праверкі is_admin.
 * Абыходзіць PostgREST без JWT (anon) і абмежаванні RLS на мутацыях.
 * Калі ключа няма (лакальна), вяртаецца user-scoped кліент.
 */
export function getAdminDatabaseClient(userScopedClient: SupabaseClient): SupabaseClient {
  return createServiceRoleClient() ?? userScopedClient;
}
