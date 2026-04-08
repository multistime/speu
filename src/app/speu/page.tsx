import { SpeuHubClient } from "@/components/speu/SpeuHubClient";
import {
  fetchSpeuChartRows,
  fetchSpeuHubArtists,
  fetchSpeuPlayableTracks,
  fetchSpeuUserLikedTracks,
} from "@/lib/speu/catalog.server";
import { fetchSpeuHubHeroDiscScale } from "@/lib/speu/site-settings.server";

/** Налады пластыны з БД — не кэшаваць старонку як статычную */
export const dynamic = "force-dynamic";

export default async function SpeuPage() {
  const [playable, chartBundle, artists, likedPreview, heroDiscScale] = await Promise.all([
    fetchSpeuPlayableTracks(),
    fetchSpeuChartRows(10),
    fetchSpeuHubArtists(24),
    fetchSpeuUserLikedTracks(10),
    fetchSpeuHubHeroDiscScale(),
  ]);

  return (
    <SpeuHubClient
      playable={playable}
      chartRows={chartBundle.rows}
      artists={artists}
      likedPreview={likedPreview}
      heroDiscScale={heroDiscScale}
    />
  );
}
