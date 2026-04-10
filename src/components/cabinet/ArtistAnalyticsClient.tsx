"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Headphones, Heart, Info, Loader2, TrendingUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";
import { profileOwnsArtist } from "@/lib/cabinet/artist-access";
import { type ArtistListenDashboardOk, parseArtistListenDashboard } from "@/lib/speu/artist-analytics";
import { cn } from "@/lib/utils";
import { ListenDailyLineChart } from "@/components/analytics/listen-dashboard/ListenDailyLineChart";
import { ListenKpiStrip } from "@/components/analytics/listen-dashboard/ListenKpiStrip";
import { ListenMethodologyDialog } from "@/components/analytics/listen-dashboard/ListenMethodologyDialog";
import { ListenTracksTable } from "@/components/analytics/listen-dashboard/ListenTracksTable";
import { LISTEN_PERIODS, formatListenDelta, type ListenPeriodDays } from "@/components/analytics/listen-dashboard/shared";
import { TopTracksPanel } from "@/components/analytics/listen-dashboard/TopTracksPanel";
import { TrackDynamicsDialog } from "@/components/analytics/listen-dashboard/TrackDynamicsDialog";

export function ArtistAnalyticsClient({ artistId }: { artistId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [period, setPeriod] = useState<ListenPeriodDays>(28);
  const [data, setData] = useState<ArtistListenDashboardOk | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [trackDialogId, setTrackDialogId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    if (!artistId) {
      setAllowed(false);
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/cabinet");
      return;
    }
    const profile = await getSpeuProfile(supabase, user.id);
    if (!profileOwnsArtist(profile, artistId)) {
      setAllowed(false);
      setLoading(false);
      return;
    }
    setAllowed(true);

    const { data: raw, error } = await supabase.schema("speu").rpc("artist_listen_dashboard", {
      p_period_days: period,
      p_artist_id: artistId,
    });
    if (error) {
      setErr(error.message);
      setData(null);
      setLoading(false);
      return;
    }
    const parsed = parseArtistListenDashboard(raw);
    if (!parsed || !parsed.ok) {
      const code = parsed?.error;
      const msg =
        code === "not_artist"
          ? "Не знойдзены профіль артыста."
          : code === "forbidden"
            ? "Няма доступу да гэтай картачкі артыста."
            : code === "artist_required"
              ? "Абярыце артыста ў кабінеце."
              : "Не ўдалося загрузіць даныя.";
      setErr(msg);
      setData(null);
    } else {
      setData(parsed);
    }
    setLoading(false);
  }, [artistId, period, router, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() triggers async dashboard fetch
    void load();
  }, [load]);

  const kpiItems = useMemo(() => {
    if (!data) return [];
    const s = data.summary;
    const topTrack = data.tracks[0];
    const rs = data.range.start;
    const re = data.range.end;
    return [
      {
        key: "sessions",
        title: "Сесіі",
        value: s.total_sessions.toLocaleString("be-BY"),
        delta: formatListenDelta(s.total_sessions, s.prev_total_sessions),
        icon: Headphones,
        accentKey: "emerald" as const,
        sparkline: { daily: data.daily, rangeStart: rs, rangeEnd: re, series: "total" as const },
      },
      {
        key: "unique",
        title: "Унікальныя",
        value: s.unique_listeners.toLocaleString("be-BY"),
        delta: formatListenDelta(s.unique_listeners, s.prev_unique_listeners),
        icon: Users,
        accentKey: "sky" as const,
      },
      {
        key: "full",
        title: "Поўныя",
        value: s.full_listens.toLocaleString("be-BY"),
        delta: formatListenDelta(s.full_listens, s.prev_full_listens),
        icon: TrendingUp,
        accentKey: "teal" as const,
        sparkline: { daily: data.daily, rangeStart: rs, rangeEnd: re, series: "full" as const },
      },
      {
        key: "top",
        title: "Топ трэк",
        value: topTrack ? topTrack.title : "—",
        icon: Heart,
        accentKey: "amber" as const,
        compactValue: Boolean(topTrack),
        onPress: topTrack ? () => setTrackDialogId(topTrack.id) : undefined,
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="glass rounded-2xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Няма доступу да кабінета гэтага артыста. Выберыце картачку ў спісе або звярніцеся да лэйбла.
        </p>
        <Link href="/cabinet/artist" className="inline-block mt-4 text-sm text-primary hover:underline">
          Да выбару артыста
        </Link>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
              <BarChart3 className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground italic">Аналітыка</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Як слухаюць вашы трэкі</p>
            </div>
          </div>
        </header>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-3">
          {err ?? "Памылка"}
        </div>
        <p className="text-xs text-muted-foreground">
          Калі вы ўжо артыст: ужыйце міграцыю БД з функцыяй{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">artist_listen_dashboard</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
            <BarChart3 className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-foreground italic">Аналітыка</h1>
              <button
                type="button"
                onClick={() => setMethodologyOpen(true)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Як лічым"
                title="Як лічым"
              >
                <Info className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Кароткія паказчыкі і дынаміка па днях</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {LISTEN_PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setPeriod(p.days)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors",
                period === p.days
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <ListenKpiStrip items={kpiItems} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 glass rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Дынаміка па днях</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            {data.range.start} — {data.range.end} · параўнанне з {data.prev_range.start} — {data.prev_range.end}
          </p>
          <ListenDailyLineChart
            days={data.daily}
            rangeStart={data.range.start}
            rangeEnd={data.range.end}
          />
        </div>
        <div className="lg:col-span-2 glass rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Топ трэкаў</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Націсніце, каб убачыць дынаміку трэку</p>
          {data.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Няма трэкаў у каталогу для гэтага артыста.</p>
          ) : (
            <TopTracksPanel tracks={data.tracks} onSelectTrack={(t) => setTrackDialogId(t.id)} />
          )}
        </div>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 bg-card/20">
          <h2 className="text-sm font-semibold text-foreground">Усе трэкі</h2>
        </div>
        <ListenTracksTable tracks={data.tracks} onTrackClick={(t) => setTrackDialogId(t.id)} />
      </div>

      <ListenMethodologyDialog open={methodologyOpen} onClose={() => setMethodologyOpen(false)} />
      <TrackDynamicsDialog
        open={trackDialogId !== null}
        onClose={() => setTrackDialogId(null)}
        trackId={trackDialogId}
        periodDays={period}
        supabase={supabase}
      />
    </div>
  );
}
