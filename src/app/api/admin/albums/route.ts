import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";
import { allocateUniqueSlug } from "@/lib/speu/slug-db.server";

const emptyToNull = (v: unknown) => {
  if (v == null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
};

const optionalAlbumSlug = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  },
  z.string().min(1).max(200).optional()
);

const albumSchema = z.object({
  id: z.string().uuid().optional(),
  /** @deprecated выкарыстоўвайце artistIds */
  artistId: z.string().uuid().optional(),
  artistIds: z.array(z.string().uuid()).optional(),
  title: z.string().min(1),
  /** Пуста — аўта з назвы. */
  slug: optionalAlbumSlug.optional(),
  coverUrl: z.preprocess(emptyToNull, z.string().nullable().optional()),
  releaseDate: z.preprocess((v) => {
    const n = emptyToNull(v);
    if (n == null) return null;
    if (typeof n !== "string") return null;
    const s = n.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    return s;
  }, z.string().nullable().optional()),
  description: z.preprocess(emptyToNull, z.string().nullable().optional()),
  isPublished: z.boolean().default(false),
  sortOrder: z.preprocess((v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }, z.number().int()),
});

function resolveAlbumArtistIds(data: z.infer<typeof albumSchema>): string[] | null {
  const fromList = data.artistIds?.length
    ? [...new Set(data.artistIds)]
    : data.artistId
      ? [data.artistId]
      : null;
  return fromList && fromList.length > 0 ? fromList : null;
}

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Fetch albums and artists separately to avoid PostgREST schema cache dependency
  const { data: albums, error: albumsError } = await adminDb
    .schema("speu")
    .from("albums")
    .select("*")
    .order("sort_order", { ascending: true });

  if (albumsError) {
    return NextResponse.json({ error: "fetch_failed", details: albumsError.message }, { status: 500 });
  }

  const albumIds = (albums ?? []).map((a: { id: string }) => a.id);
  const { data: links } =
    albumIds.length > 0
      ? await adminDb
          .schema("speu")
          .from("album_artists")
          .select("album_id, artist_id, sort_order")
          .in("album_id", albumIds)
          .order("album_id", { ascending: true })
          .order("sort_order", { ascending: true })
      : { data: [] as { album_id: string; artist_id: string; sort_order: number }[] };

  const artistIdsOrdered = new Map<string, string[]>();
  for (const row of links ?? []) {
    const arr = artistIdsOrdered.get(row.album_id) ?? [];
    arr.push(row.artist_id);
    artistIdsOrdered.set(row.album_id, arr);
  }

  const allArtistIds = [...new Set((links ?? []).map((l) => l.artist_id))];
  const { data: artists, error: artistsError } = allArtistIds.length > 0
    ? await adminDb.schema("speu").from("artists").select("id, name, slug").in("id", allArtistIds)
    : { data: [], error: null };

  if (artistsError) {
    return NextResponse.json(
      { error: "fetch_failed", details: artistsError.message },
      { status: 500 }
    );
  }

  const artistMap = Object.fromEntries((artists ?? []).map((a: { id: string; name: string; slug: string }) => [a.id, a]));

  const items = (albums ?? []).map((album: Record<string, unknown>) => {
    const ids =
      artistIdsOrdered.get(album.id as string) ??
      (album.artist_id ? [album.artist_id as string] : []);
    const artistsList = ids.map((id) => artistMap[id]).filter(Boolean);
    const primaryId = (ids[0] ?? album.artist_id) as string | undefined;
    return {
      ...album,
      artist_ids: ids,
      artists_list: artistsList,
      artist_id: primaryId ?? album.artist_id,
      artists: primaryId ? artistMap[primaryId] ?? artistsList[0] ?? null : artistsList[0] ?? null,
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = albumSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });

  const artistIds = resolveAlbumArtistIds(parsed.data);
  if (!artistIds) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Патрабуецца хаця б адзін артыст (artistIds)" },
      { status: 400 }
    );
  }

  const slug = await allocateUniqueSlug(
    adminDb,
    "albums",
    parsed.data.title,
    parsed.data.id,
    parsed.data.slug ?? null
  );

  const row: Record<string, unknown> = {
    artist_id: artistIds[0],
    title: parsed.data.title,
    slug,
    cover_url: parsed.data.coverUrl ?? null,
    release_date: parsed.data.releaseDate ?? null,
    description: parsed.data.description ?? null,
    is_published: parsed.data.isPublished,
    sort_order: parsed.data.sortOrder,
    updated_by: user.id,
  };

  const syncAlbumArtists = async (albumId: string) => {
    const { error: delErr } = await adminDb.schema("speu").from("album_artists").delete().eq("album_id", albumId);
    if (delErr) throw new Error(delErr.message);
    const rows = artistIds.map((artist_id, sort_order) => ({ album_id: albumId, artist_id, sort_order }));
    const { error: insErr } = await adminDb.schema("speu").from("album_artists").insert(rows);
    if (insErr) throw new Error(insErr.message);
  };

  if (parsed.data.id) {
    const { data, error } = await adminDb
      .schema("speu")
      .from("albums")
      .update(row)
      .eq("id", parsed.data.id)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
    try {
      await syncAlbumArtists(data.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "sync_failed";
      return NextResponse.json({ error: "save_failed", details: msg }, { status: 500 });
    }
    await writeAdminAuditLog(adminDb, user.id, "album.update", "albums", data.id, { title: parsed.data.title });
    return NextResponse.json({ ok: true, id: data.id });
  }

  row.created_by = user.id;
  const { data, error } = await adminDb
    .schema("speu")
    .from("albums")
    .insert(row)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
  try {
    await syncAlbumArtists(data.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync_failed";
    return NextResponse.json({ error: "save_failed", details: msg }, { status: 500 });
  }
  await writeAdminAuditLog(adminDb, user.id, "album.create", "albums", data.id, { title: parsed.data.title });
  return NextResponse.json({ ok: true, id: data.id });
}
