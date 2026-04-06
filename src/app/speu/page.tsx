import { SpeuHubClient } from "@/components/speu/SpeuHubClient";
import { fetchSpeuHubArtists, fetchSpeuPlayableTracks } from "@/lib/speu/catalog.server";

export default async function SpeuPage() {
  const [playable, artists] = await Promise.all([
    fetchSpeuPlayableTracks(),
    fetchSpeuHubArtists(24),
  ]);

  return <SpeuHubClient playable={playable} artists={artists} />;
}
