import { NextResponse } from "next/server";
import { fetchSpeuPlayableTracks, compareSpeuChartTiebreak } from "@/lib/speu/catalog.server";
import { minskTodayYmd, minskYmdMinusDays } from "@/lib/speu/chart-dates";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const PARTIAL_WEIGHT = 0.25;
const WINDOW_DAYS = 7;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }

  const today = minskTodayYmd();
  const from = minskYmdMinusDays(today, WINDOW_DAYS - 1);

  const { data: rollup, error: rErr } = await svc
    .schema("speu")
    .from("track_listen_by_day_minsk")
    .select("track_id, full_to_chart, partial_to_chart")
    .gte("day_minsk", from)
    .lte("day_minsk", today);

  if (rErr) {
    console.error("[publish-chart rollup]", rErr.message);
    return NextResponse.json({ error: "rollup_failed" }, { status: 500 });
  }

  const scoreMap = new Map<string, number>();
  for (const row of rollup ?? []) {
    const tid = row.track_id as string;
    const add =
      Number(row.full_to_chart ?? 0) + Number(row.partial_to_chart ?? 0) * PARTIAL_WEIGHT;
    scoreMap.set(tid, (scoreMap.get(tid) ?? 0) + add);
  }

  const playable = await fetchSpeuPlayableTracks();
  const sorted = [...playable].sort((a, b) => {
    const sa = scoreMap.get(a.id) ?? 0;
    const sb = scoreMap.get(b.id) ?? 0;
    if (sb !== sa) return sb - sa;
    return compareSpeuChartTiebreak(a, b);
  });

  const top = sorted.slice(0, 100);

  const { error: delErr } = await svc.schema("speu").from("chart_snapshots").delete().eq("snapshot_date", today);

  if (delErr) {
    console.error("[publish-chart delete]", delErr.message);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  if (top.length === 0) {
    return NextResponse.json({ ok: true, snapshot_date: today, rows: 0 });
  }

  const rows = top.map((t, i) => ({
    snapshot_date: today,
    rank: i + 1,
    track_id: t.id,
    score: scoreMap.get(t.id) ?? 0,
  }));

  const { error: insErr } = await svc.schema("speu").from("chart_snapshots").insert(rows);

  if (insErr) {
    console.error("[publish-chart insert]", insErr.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    snapshot_date: today,
    rows: rows.length,
  });
}
