import type { PlayerTrack } from "@/contexts/PlayerContext";
import type { SpeuPublicTrack } from "@/lib/speu/types";

export function speuPublicTrackToPlayerTrack(t: SpeuPublicTrack): PlayerTrack {
  const primary = t.artists[0];
  return {
    id: t.id,
    title: t.title,
    audioUrl: t.audioUrl,
    artistName: t.artistLine,
    coverUrl: t.coverUrl,
    accentColor: t.accentColor,
    accentRgb: t.accentRgb,
    trackHref: `/speu/tracks/${t.slug}`,
    artistSlug: primary?.slug ?? null,
    albumSlug: t.album?.slug ?? null,
    albumTitle: t.album?.title ?? null,
    navArtists: t.artists.map((a) => ({ slug: a.slug, name: a.name })),
  };
}
