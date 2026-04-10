import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const ANON_COOKIE = "speu_anon_listener";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function clientIp(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  const real = h.get("x-real-ip");
  return real?.trim() ?? null;
}

export async function POST(req: Request) {
  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }

  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  const cookieStore = await cookies();
  let anonId: string | null = null;
  if (!user) {
    const raw = cookieStore.get(ANON_COOKIE)?.value?.trim();
    anonId = raw && isUuid(raw) ? raw : null;
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

  const o = body as Record<string, unknown>;
  const listeningSessionId = o.listeningSessionId;
  const trackId = o.trackId;
  const durationMs = o.durationMs;
  const maxPositionMs = o.maxPositionMs;
  const hadUserSeek = o.hadUserSeek;
  const hadUserPause = o.hadUserPause;
  const shortGapCount = o.shortGapCount;

  if (typeof listeningSessionId !== "string" || !isUuid(listeningSessionId)) {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }
  if (typeof trackId !== "string" || !isUuid(trackId)) {
    return NextResponse.json({ error: "invalid_track_id" }, { status: 400 });
  }
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs) || durationMs < 0) {
    return NextResponse.json({ error: "invalid_duration" }, { status: 400 });
  }
  if (typeof maxPositionMs !== "number" || !Number.isFinite(maxPositionMs)) {
    return NextResponse.json({ error: "invalid_position" }, { status: 400 });
  }
  if (typeof hadUserSeek !== "boolean" || typeof hadUserPause !== "boolean") {
    return NextResponse.json({ error: "invalid_flags" }, { status: 400 });
  }
  const gaps =
    typeof shortGapCount === "number" && Number.isFinite(shortGapCount)
      ? Math.max(0, Math.floor(shortGapCount))
      : 0;

  const h = await headers();
  const ip = clientIp(h);

  let setAnonCookie: string | null = null;
  if (!user) {
    if (!anonId) {
      anonId = randomUUID();
      setAnonCookie = anonId;
    }
  }

  const { data: rpcData, error: rpcErr } = await svc.schema("speu").rpc("record_listen_terminal", {
    p_listening_session: listeningSessionId,
    p_track_id: trackId,
    p_user_id: user?.id ?? null,
    p_anon_id: user ? null : anonId,
    p_duration_ms: Math.round(durationMs),
    p_max_position_ms: Math.round(maxPositionMs),
    p_had_user_seek: hadUserSeek,
    p_had_user_pause: hadUserPause,
    p_short_gap_count: gaps,
    p_client_ip: ip,
  });

  if (rpcErr) {
    console.warn(
      JSON.stringify({
        speu_listen_reject: true,
        error: "record_failed",
        status: 500,
        rpc_message: rpcErr.message,
      }),
    );
    return NextResponse.json({ error: "record_failed" }, { status: 500 });
  }

  const row = rpcData as Record<string, unknown> | null;
  if (row?.ok !== true) {
    const err = typeof row?.error === "string" ? row.error : "rejected";
    const status =
      err === "rate_listener" || err === "rate_ip"
        ? 429
        : err === "track_not_eligible" || err === "duration_mismatch" || err === "position_overflow"
          ? 422
          : 400;
    const trackPrefix = typeof trackId === "string" ? `${trackId.slice(0, 8)}…` : null;
    console.warn(
      JSON.stringify({
        speu_listen_reject: true,
        error: err,
        status,
        track_id_prefix: trackPrefix,
      }),
    );
    return NextResponse.json({ error: err }, { status });
  }

  const res = NextResponse.json({
    ok: true,
    duplicate: row.duplicate === true,
    qualifies_partial: row.qualifies_partial === true,
    qualifies_full: row.qualifies_full === true,
    counts_partial_chart: row.counts_partial_chart === true,
    counts_full_chart: row.counts_full_chart === true,
  });

  if (setAnonCookie) {
    res.cookies.set(ANON_COOKIE, setAnonCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return res;
}
