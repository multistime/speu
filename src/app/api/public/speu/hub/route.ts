import { NextResponse } from "next/server";
import { fetchSpeuHubArtists, fetchSpeuPlayableTracks } from "@/lib/speu/catalog.server";

export async function GET() {
  try {
    const [playable, artists] = await Promise.all([
      fetchSpeuPlayableTracks(),
      fetchSpeuHubArtists(24),
    ]);
    return NextResponse.json({ playable, artists });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: "hub_failed", details: msg }, { status: 500 });
  }
}
