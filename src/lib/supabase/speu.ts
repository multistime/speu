import type { SupabaseClient } from "@supabase/supabase-js";

export type SpeuLinkedArtist = {
  id: string;
  name: string;
  slug: string;
  /** false — лэйбл адключыў рэдагаванне публічнай картачкі з кабінета */
  can_edit_profile?: boolean;
};

export type SpeuProfile = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  /** true when at least one speu.artists row has user_id = this profile */
  is_artist?: boolean;
  /** Першы артыст па назве (сумяшчальнасць); для спісу глядзіце linked_artists */
  artist_id?: string | null;
  /** Усе картачкі артыстаў, прывязаныя да акаўнта */
  linked_artists?: SpeuLinkedArtist[];
  /** Перавагі глабальнага плэера (захоўваюцца ў speu.profiles) */
  player_queue_repeat_mode?: "off" | "all" | "one";
  player_queue_shuffle?: boolean;
  player_single_repeat?: boolean;
  /** Прэсет палітры UI: default, lyasun (прадвызначэнне), vuzel, rasitsa, balota, zhytnik */
  ui_accent_preset_id?: string;
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
