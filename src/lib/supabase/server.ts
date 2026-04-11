import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Ананімны кліент без cookies сесіі — для публічнага каталога ў RSC/API.
 * Той жа @supabase/ssr, што і createClient (інлайн NEXT_PUBLIC_* на білдзе); supabase-js напрамую ламае prerender на Vercel.
 * Паводзіны як у гасця: тыя ж RLS. Абыходзіць біты JWT у cookie.
 */
export function createAnonServerClient() {
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
