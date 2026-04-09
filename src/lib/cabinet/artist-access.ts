import type { SpeuProfile } from "@/lib/supabase/speu";

export function profileOwnsArtist(profile: SpeuProfile | null, artistId: string): boolean {
  if (!profile?.is_artist) return false;
  const linked = profile.linked_artists;
  if (Array.isArray(linked) && linked.length > 0) {
    return linked.some((a) => a && typeof a === "object" && "id" in a && (a as { id: string }).id === artistId);
  }
  return profile.artist_id === artistId;
}

/** Калі false — кабінет ёсць, але рэдагаванне картачкі на сайце адключана лэйблам. */
export function linkedArtistCanEditProfile(profile: SpeuProfile | null, artistId: string): boolean {
  if (!profile || !profileOwnsArtist(profile, artistId)) return false;
  const linked = profile.linked_artists;
  if (!Array.isArray(linked)) return true;
  const row = linked.find(
    (a) => a && typeof a === "object" && "id" in a && (a as { id: string }).id === artistId,
  ) as { can_edit_profile?: boolean } | undefined;
  if (row && typeof row.can_edit_profile === "boolean") return row.can_edit_profile;
  return true;
}
