import { NextResponse } from "next/server";
import {
  fetchSpeuChartRows,
  fetchSpeuHubArtists,
  fetchSpeuPlayableTracks,
} from "@/lib/speu/catalog.server";
import { fetchSpeuHubHeroDiscScale } from "@/lib/speu/site-settings.server";

export async function GET() {
  try {
    const [playable, artists, chartBundle, heroDiscScale] = await Promise.all([
      fetchSpeuPlayableTracks(),
      fetchSpeuHubArtists(24),
      fetchSpeuChartRows(10),
      fetchSpeuHubHeroDiscScale(),
    ]);
    return NextResponse.json({
      playable,
      artists,
      chartRows: chartBundle.rows,
      chartSnapshotDate: chartBundle.snapshotDate,
      heroDiscScale,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: "hub_failed", details: msg }, { status: 500 });
  }
}
