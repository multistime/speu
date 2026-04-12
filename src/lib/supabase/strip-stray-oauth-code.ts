/**
 * Калі ў URL застаўся ?code= не на серверным callback, браузерны @supabase/ssr з PKCE
 * спрабуе exchangeCodeForSession без code_verifier у гэтым storage (напрыклад пасля native OAuth у WebView).
 * Выдаляем code да createBrowserClient().
 */
export function stripStrayOAuthCodeFromBrowserUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("code")) return;
    const path = url.pathname;
    if (path === "/api/auth/callback" || path.startsWith("/api/auth/callback/")) return;
    if (path === "/auth/mobile-oauth" || path.startsWith("/auth/mobile-oauth/")) return;
    url.searchParams.delete("code");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  } catch {
    /* ignore */
  }
}
