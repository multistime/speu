import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

const cacheHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ likes: [] as string[] }, { headers: cacheHeaders });
  }

  const { data, error } = await supabase
    .schema("speu")
    .from("track_likes")
    .select("track_id");

  if (error) {
    console.error("[api/user/track-likes GET]", error.message);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const likes = (data ?? []).map((r) => r.track_id as string);
  return NextResponse.json({ likes }, { headers: cacheHeaders });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const trackId = (body as { trackId?: unknown }).trackId;
  const liked = (body as { liked?: unknown }).liked;

  if (typeof trackId !== "string" || !isUuid(trackId)) {
    return NextResponse.json({ error: "invalid_track_id" }, { status: 400 });
  }
  if (typeof liked !== "boolean") {
    return NextResponse.json({ error: "invalid_liked" }, { status: 400 });
  }

  if (liked) {
    const { data: ok, error: rpcErr } = await supabase
      .schema("speu")
      .rpc("track_is_publicly_likeable", { _track_id: trackId });

    if (rpcErr) {
      console.error("[api/user/track-likes POST rpc]", rpcErr.message);
      return NextResponse.json({ error: "likeable_check_failed" }, { status: 500 });
    }
    if (!ok) {
      return NextResponse.json({ error: "track_not_likeable" }, { status: 404 });
    }

    const { error: insErr } = await supabase.schema("speu").from("track_likes").upsert(
      { user_id: user.id, track_id: trackId },
      { onConflict: "user_id,track_id", ignoreDuplicates: true },
    );

    if (insErr) {
      console.error("[api/user/track-likes POST insert]", insErr.message);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }
  } else {
    const { error: delErr } = await supabase
      .schema("speu")
      .from("track_likes")
      .delete()
      .eq("track_id", trackId);

    if (delErr) {
      console.error("[api/user/track-likes POST delete]", delErr.message);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true }, { headers: cacheHeaders });
}
