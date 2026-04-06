import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeManualSlugInput, slugifyTitle } from "@/lib/speu/slug";

type SpeuTable = "albums" | "artist_tracks";

async function slugIsFree(
  adminDb: SupabaseClient,
  table: SpeuTable,
  candidate: string,
  excludeId?: string
): Promise<boolean> {
  const { data, error } = await adminDb
    .schema("speu")
    .from(table)
    .select("id")
    .eq("slug", candidate)
    .maybeSingle();

  if (error) return false;
  if (!data) return true;
  return excludeId !== undefined && data.id === excludeId;
}

/**
 * Унікальны slug у табліцы speu.* для адмінскага кліента.
 * @param manualSlugRaw — калі задана (пасля нармалізацыі непуста), база для slug; інакш — з `title`.
 */
export async function allocateUniqueSlug(
  adminDb: SupabaseClient,
  table: SpeuTable,
  title: string,
  excludeId?: string,
  manualSlugRaw?: string | null
): Promise<string> {
  const manual = normalizeManualSlugInput(manualSlugRaw ?? null);
  const base = manual ?? slugifyTitle(title);
  if (await slugIsFree(adminDb, table, base, excludeId)) return base;

  for (let i = 2; i < 500; i++) {
    const candidate = `${base}-${i}`;
    if (await slugIsFree(adminDb, table, candidate, excludeId)) return candidate;
  }

  const tail = Math.random().toString(36).slice(2, 10);
  return `${base}-${tail}`;
}
