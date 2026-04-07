import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const releaseStatuses = ["draft", "submitted", "needs_changes", "approved", "rejected"] as const;

const patchSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(releaseStatuses).optional(),
    moderator_message: z.string().nullable().optional(),
  })
  .refine((d) => d.status !== undefined || d.moderator_message !== undefined, {
    message: "need_status_or_message",
  });

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await adminDb
    .schema("speu")
    .from("release_submissions")
    .select(
      `
      id,
      artist_id,
      user_id,
      release_kind,
      status,
      title,
      cover_url,
      cover_storage_path,
      artist_note,
      moderator_message,
      created_at,
      updated_at,
      artists ( id, name, slug ),
      release_submission_tracks ( id, title, sort_order, audio_url, notes )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin/release-submissions GET]", error.message);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  type ArtistEmbed = { id: string; name: string; slug: string };
  type TrackEmbed = {
    id: string;
    title: string;
    sort_order: number;
    audio_url: string | null;
    notes: string | null;
  };
  type Row = {
    id: string;
    artist_id: string;
    user_id: string;
    release_kind: string;
    status: string;
    title: string;
    cover_url: string | null;
    cover_storage_path: string | null;
    artist_note: string | null;
    moderator_message: string | null;
    created_at: string;
    updated_at: string;
    artists: ArtistEmbed | ArtistEmbed[] | null;
    release_submission_tracks: TrackEmbed[] | null;
  };

  const items = (data ?? []).map((row: Row) => {
    const { artists, release_submission_tracks, ...rest } = row;
    const artist = Array.isArray(artists) ? artists[0] ?? null : artists;
    const sortedTracks = [...(release_submission_tracks ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    return { ...rest, artist, tracks: sortedTracks };
  });

  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const { id, status, moderator_message } = parsed.data;
  const patch: Record<string, unknown> = {};
  if (status !== undefined) patch.status = status;
  if (moderator_message !== undefined) patch.moderator_message = moderator_message;

  const { error } = await adminDb.schema("speu").from("release_submissions").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });

  await writeAdminAuditLog(adminDb, user.id, "release_submission.update", "release_submissions", id, {
    status,
    moderator_message,
  });

  return NextResponse.json({ ok: true });
}
