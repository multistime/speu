import { SpeuHubClient } from "@/components/speu/SpeuHubClient";
import {
  fetchSpeuHubArtists,
  fetchSpeuPlayableTracks,
  fetchSpeuUserLikedTracks,
} from "@/lib/speu/catalog.server";
import { fetchSpeuHubHeroDiscScale } from "@/lib/speu/site-settings.server";

export default async function SpeuPage() {
  const [playable, artists, likedPreview, heroDiscScale] = await Promise.all([
    fetchSpeuPlayableTracks(),
    fetchSpeuHubArtists(24),
    fetchSpeuUserLikedTracks(10),
    fetchSpeuHubHeroDiscScale(),
  ]);

  return (
    <SpeuHubClient
      playable={playable}
      artists={artists}
      likedPreview={likedPreview}
      heroDiscScale={heroDiscScale}
    />
  );
}
