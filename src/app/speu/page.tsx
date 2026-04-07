import { SpeuHubClient } from "@/components/speu/SpeuHubClient";
import {
  fetchSpeuHubArtists,
  fetchSpeuPlayableTracks,
  fetchSpeuUserLikedTracks,
} from "@/lib/speu/catalog.server";

export default async function SpeuPage() {
  const [playable, artists, likedPreview] = await Promise.all([
    fetchSpeuPlayableTracks(),
    fetchSpeuHubArtists(24),
    fetchSpeuUserLikedTracks(10),
  ]);

  return <SpeuHubClient playable={playable} artists={artists} likedPreview={likedPreview} />;
}
