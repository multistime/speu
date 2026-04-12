import { createBrowserClient } from "@supabase/ssr";

import { stripStrayOAuthCodeFromBrowserUrl } from "./strip-stray-oauth-code";

stripStrayOAuthCodeFromBrowserUrl();

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
