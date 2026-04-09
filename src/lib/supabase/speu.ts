import type { SupabaseClient } from "@supabase/supabase-js";

export type SpeuProfile = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  /** true when speu.artists.user_id = this profile (заяўкі на рэліз у кабінеце артыста) */
  is_artist?: boolean;
  artist_id?: string | null;
  /** Перавагі глабальнага плэера (захоўваюцца ў speu.profiles) */
  player_queue_repeat_mode?: "off" | "all" | "one";
  player_queue_shuffle?: boolean;
  player_single_repeat?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getSpeuProfile(
  _supabase: SupabaseClient,
  _userId: string
): Promise<SpeuProfile | null> {
  // Fetch via our server-side API route so the request uses HTTP cookies,
  // which are reliably set by the middleware — bypasses browser-client auth quirks.
  try {
    const res = await fetch("/api/user/profile", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json() as SpeuProfile | null;
    return data;
  } catch (err) {
    console.error("[getSpeuProfile]", err);
    return null;
  }
}
