import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveDurationSecFromAudioUrl } from "@/lib/speu/audio-duration-from-url.server";
import { allocateUniqueSlug } from "@/lib/speu/slug-db.server";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

type SubmissionTrackRow = {
  id: string;
  title: string;
  sort_order: number;
  audio_url: string | null;
  duration_sec: number | null;
  lyrics: string | null;
  artist_track_id: string | null;
};

type SubmissionRow = {
  id: string;
  status: string;
  artist_id: string;
  title: string;
  cover_url: string | null;
  release_submission_tracks: SubmissionTrackRow[] | null;
};

/**
 * For an approved release submission, create unpublished catalog tracks for each
 * submission track that is not yet linked (artist_track_id is null).
 */
export async function promoteApprovedReleaseSubmission(
  adminDb: SupabaseClient,
  moderatorUserId: string,
  submissionId: string
): Promise<{ createdTrackIds: string[]; error: string | null }> {
  const { data: sub, error: fetchErr } = await adminDb
    .schema("speu")
    .from("release_submissions")
    .select(
      `
      id,
      status,
      artist_id,
      title,
      cover_url,
      release_submission_tracks (
        id,
        title,
        sort_order,
        audio_url,
        duration_sec,
        lyrics,
        artist_track_id
      )
    `
    )
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchErr || !sub) {
    return { createdTrackIds: [], error: fetchErr?.message ?? "submission_not_found" };
  }

  const row = sub as unknown as SubmissionRow;
  if (row.status !== "approved") {
    return { createdTrackIds: [], error: null };
  }

  const tracks = [...(row.release_submission_tracks ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const createdTrackIds: string[] = [];

  for (const st of tracks) {
    if (st.artist_track_id) continue;

    const titleRaw = st.title?.trim() || row.title?.trim() || "Без назвы";
    const slug = await allocateUniqueSlug(adminDb, "artist_tracks", titleRaw);

    let durationSec: number | null =
      st.duration_sec != null && Number.isFinite(st.duration_sec) && st.duration_sec > 0
        ? Math.round(st.duration_sec)
        : null;
    const audioUrl = st.audio_url?.trim() || null;
    if (durationSec == null && audioUrl) {
      const resolved = await resolveDurationSecFromAudioUrl(audioUrl);
      if (resolved != null) {
        durationSec = resolved;
        await adminDb
          .schema("speu")
          .from("release_submission_tracks")
          .update({ duration_sec: resolved })
          .eq("id", st.id);
      }
    }

    const { data: inserted, error: insErr } = await adminDb
      .schema("speu")
      .from("artist_tracks")
      .insert({
        artist_id: row.artist_id,
        album_id: null,
        title: titleRaw,
        slug,
        audio_url: audioUrl,
        external_url: null,
        cover_url: row.cover_url?.trim() || null,
        duration_sec: durationSec,
        track_number: null,
        sort_order: st.sort_order,
        is_published: false,
        play_on_radio: false,
        lyrics: st.lyrics?.trim() || null,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      await rollbackPromotion(adminDb, createdTrackIds);
      return { createdTrackIds: [], error: insErr?.message ?? "track_insert_failed" };
    }

    const trackId = inserted.id as string;

    const { error: linkErr } = await adminDb.schema("speu").from("track_artists").insert({
      track_id: trackId,
      artist_id: row.artist_id,
      sort_order: 0,
    });
    if (linkErr) {
      await adminDb.schema("speu").from("artist_tracks").delete().eq("id", trackId);
      await rollbackPromotion(adminDb, createdTrackIds);
      return { createdTrackIds: [], error: linkErr.message };
    }

    const { error: subTrErr } = await adminDb
      .schema("speu")
      .from("release_submission_tracks")
      .update({ artist_track_id: trackId })
      .eq("id", st.id);
    if (subTrErr) {
      await adminDb.schema("speu").from("track_artists").delete().eq("track_id", trackId);
      await adminDb.schema("speu").from("artist_tracks").delete().eq("id", trackId);
      await rollbackPromotion(adminDb, createdTrackIds);
      return { createdTrackIds: [], error: subTrErr.message };
    }

    createdTrackIds.push(trackId);
    await writeAdminAuditLog(adminDb, moderatorUserId, "song.create", "artist_tracks", trackId, {
      from_release_submission_id: row.id,
      from_release_submission_track_id: st.id,
      title: titleRaw,
    });
  }

  return { createdTrackIds, error: null };
}

async function rollbackPromotion(adminDb: SupabaseClient, trackIds: string[]) {
  if (trackIds.length === 0) return;
  await adminDb
    .schema("speu")
    .from("release_submission_tracks")
    .update({ artist_track_id: null })
    .in("artist_track_id", trackIds);
  await adminDb.schema("speu").from("track_artists").delete().in("track_id", trackIds);
  await adminDb.schema("speu").from("artist_tracks").delete().in("id", trackIds);
}
