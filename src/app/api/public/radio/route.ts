import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function pickAudioUrl(row: {
  audio_url: string | null;
  external_url: string | null;
}): string | null {
  const a = row.audio_url?.trim();
  if (a) return a;
  const e = row.external_url?.trim();
  if (e) return e;
  return null;
}

function artistNameFromRow(artists: unknown): string | null {
  if (!artists) return null;
  if (Array.isArray(artists)) {
    const first = artists[0] as { name?: string } | undefined;
    return first?.name ?? null;
  }
  const o = artists as { name?: string };
  return o.name ?? null;
}

export async function GET() {
  const supabase = await createClient();

  const { data: settingsRows, error: settingsError } = await supabase
    .schema("speu")
    .from("site_settings")
    .select("key, value")
    .like("key", "radio_%");

  if (settingsError) {
    return NextResponse.json({ error: "settings_failed", details: settingsError.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  (settingsRows ?? []).forEach((r: { key: string; value: string | null }) => {
    settings[r.key] = r.value ?? "";
  });

  const enabled = settings["radio_enabled"] !== "false";

  const { data: trackRows, error: tracksError } = await supabase
    .schema("speu")
    .from("artist_tracks")
    .select("id, title, audio_url, external_url, cover_url, duration_sec, artists(name)")
    .eq("play_on_radio", true)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (tracksError) {
    return NextResponse.json({ error: "tracks_failed", details: tracksError.message }, { status: 500 });
  }

  const tracks = (trackRows ?? [])
    .map((row: {
      id: string;
      title: string;
      audio_url: string | null;
      external_url: string | null;
      cover_url: string | null;
      duration_sec: number | null;
      artists: unknown;
    }) => {
      const url = pickAudioUrl(row);
      if (!url) return null;
      return {
        id: row.id,
        title: row.title,
        audioUrl: url,
        coverUrl: row.cover_url,
        durationSec: row.duration_sec,
        artistName: artistNameFromRow(row.artists),
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    title: string;
    audioUrl: string;
    coverUrl: string | null;
    durationSec: number | null;
    artistName: string | null;
  }>;

  const streamUrl = settings["radio_stream_url"]?.trim() || "";
  const fallbackUrl = settings["radio_fallback_url"]?.trim() || "";
  const envStream = process.env.NEXT_PUBLIC_RADYO_MARA_STREAM_URL?.trim() || "";

  const effectiveStream = streamUrl || envStream;
  const mode: "playlist" | "stream" | "off" =
    tracks.length > 0 ? "playlist" : effectiveStream ? "stream" : "off";

  return NextResponse.json({
    enabled,
    mode,
    name: settings["radio_name"] || "Радыё Мара",
    description: settings["radio_description"] || "",
    streamUrl: effectiveStream || null,
    fallbackStreamUrl: fallbackUrl || null,
    tracks,
  });
}
