import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import {
  fetchSpeuChartRows,
  fetchSpeuHubArtists,
  fetchSpeuPlayableTracks,
} from "@/lib/speu/catalog.server";
import { fetchSpeuHubHeroDiscScale } from "@/lib/speu/site-settings.server";

const getCachedPlayable = unstable_cache(
  () => fetchSpeuPlayableTracks(),
  ["speu-playable-tracks"],
  { revalidate: 60 },
);

const getCachedHubArtists = unstable_cache(
  () => fetchSpeuHubArtists(24),
  ["speu-hub-artists-24"],
  { revalidate: 120 },
);

const getCachedHeroDiscScale = unstable_cache(
  () => fetchSpeuHubHeroDiscScale(),
  ["speu-hub-hero-disc-scale"],
  { revalidate: 300 },
);

export async function GET() {
  try {
    const [playable, artists, heroDiscScale] = await Promise.all([
      getCachedPlayable(),
      getCachedHubArtists(),
      getCachedHeroDiscScale(),
    ]);
    const chartBundle = await fetchSpeuChartRows(10, playable);
    const body = {
      playable,
      artists,
      chartRows: chartBundle.rows,
      chartSnapshotDate: chartBundle.snapshotDate,
      heroDiscScale,
    };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: "hub_failed", details: msg }, { status: 500 });
  }
}
