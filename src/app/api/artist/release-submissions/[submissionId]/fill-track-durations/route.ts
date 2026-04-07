import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveDurationSecFromAudioUrl } from "@/lib/speu/audio-duration-from-url.server";

type Row = { id: string; audio_url: string | null; duration_sec: number | null };

/**
 * For authenticated artist: compute missing durations from audio_url (no DB write).
 * Client merges `resolved` into local state then saves.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: sub, error: subErr } = await supabase
    .schema("speu")
    .from("release_submissions")
    .select("id, user_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (subErr || !sub || sub.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: tracks, error: trErr } = await supabase
    .schema("speu")
    .from("release_submission_tracks")
    .select("id, audio_url, duration_sec")
    .eq("submission_id", submissionId);

  if (trErr) {
    return NextResponse.json({ error: "fetch_failed", details: trErr.message }, { status: 500 });
  }

  const resolved: { id: string; duration_sec: number }[] = [];

  for (const t of (tracks ?? []) as Row[]) {
    if (t.duration_sec != null && t.duration_sec > 0) continue;
    const url = t.audio_url?.trim();
    if (!url) continue;
    const sec = await resolveDurationSecFromAudioUrl(url);
    if (sec != null) resolved.push({ id: t.id, duration_sec: sec });
  }

  return NextResponse.json({ ok: true, resolved });
}
