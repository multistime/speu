import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Ці ёсць публічныя ключы (у некаторых кроках `next build` на Vercel яны часам не праходзяць у prerender-воркер). */
export function hasSupabasePublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * Ананімны кліент без cookies сесіі — для публічнага каталога ў RSC/API.
 * Той жа @supabase/ssr, што і createClient. Паводзіны як у гасця: тыя ж RLS. Абыходзіць біты JWT у cookie.
 */
export function createAnonServerClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no session cookies */
        },
      },
    },
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies will be set by middleware
          }
        },
      },
    }
  );
}
