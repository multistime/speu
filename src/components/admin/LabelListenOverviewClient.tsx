"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Disc,
  Headphones,
  Heart,
  Info,
  Inbox,
  Loader2,
  Music,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type ArtistListenDashboardOk, parseArtistListenDashboard } from "@/lib/speu/artist-analytics";
import { cn } from "@/lib/utils";
import { ListenDailyLineChart } from "@/components/analytics/listen-dashboard/ListenDailyLineChart";
import { ListenKpiStrip } from "@/components/analytics/listen-dashboard/ListenKpiStrip";
import { ListenMethodologyDialog } from "@/components/analytics/listen-dashboard/ListenMethodologyDialog";
import { ListenTracksTable } from "@/components/analytics/listen-dashboard/ListenTracksTable";
import { LISTEN_PERIODS, formatListenDelta, type ListenPeriodDays } from "@/components/analytics/listen-dashboard/shared";
import { TopArtistsPanel } from "@/components/analytics/listen-dashboard/TopArtistsPanel";
import { TopTracksPanel } from "@/components/analytics/listen-dashboard/TopTracksPanel";
import { TrackDynamicsDialog } from "@/components/analytics/listen-dashboard/TrackDynamicsDialog";

export function LabelListenOverviewClient() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ListenPeriodDays>(28);
  const [filterArtistId, setFilterArtistId] = useState<string | null>(null);
  const [data, setData] = useState<ArtistListenDashboardOk | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [trackDialogId, setTrackDialogId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data: raw, error } = await supabase.schema("speu").rpc("label_listen_dashboard", {
      p_period_days: period,
      p_filter_artist_id: filterArtistId,
    });
    if (error) {
      setErr(error.message);
      setData(null);
      setLoading(false);
      return;
    }
    const parsed = parseArtistListenDashboard(raw);
    if (!parsed || !parsed.ok) {
      setErr(
        parsed?.error === "forbidden"
          ? "Няма прав адміна."
          : parsed?.error === "not_authenticated"
            ? "Увайдзіце ў акаўнт."
            : "Не ўдалося загрузіць даныя.",
      );
      setData(null);
    } else {
      setData(parsed);
    }
    setLoading(false);
  }, [period, supabase, filterArtistId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() triggers async dashboard fetch
    void load();
  }, [load]);

  const filterArtistName = useMemo(() => {
    if (!filterArtistId || !data?.artists) return null;
    return data.artists.find((a) => a.id === filterArtistId)?.name ?? null;
  }, [data, filterArtistId]);

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
        accentKey: "primary" as const,
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

  if (err || !data) {
    return (
      <div className="space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
              <BarChart3 className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground italic">Агляд лэйбла</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Аналітыка праслухоўванняў і каталог</p>
            </div>
          </div>
        </header>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-3">
          {err ?? "Памылка"}
        </div>
        <p className="text-xs text-muted-foreground">
          Калі вы адмін: ужыйце міграцыю БД з функцыяй{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">label_listen_dashboard</code>.
        </p>
      </div>
    );
  }

  const cat = data.catalog;

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
            <BarChart3 className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-foreground italic">Агляд лэйбла</h1>
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
            <p className="text-sm text-muted-foreground mt-0.5">Каталог і праслухоўванні</p>
            {filterArtistId && filterArtistName ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs text-foreground">
                  Фільтр: {filterArtistName}
                  <button
                    type="button"
                    onClick={() => setFilterArtistId(null)}
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium hover:bg-primary/20"
                  >
                    Скінуць
                  </button>
                </span>
              </div>
            ) : null}
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
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {cat ? (
        <div
          className={cn(
            "flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-6 sm:overflow-visible sm:pb-0",
            "[scrollbar-width:thin]",
          )}
        >
          <div className="relative overflow-hidden rounded-2xl border bg-card/40 p-4 border-border/80 shadow-sm shrink-0 w-[min(100%,10rem)] snap-start sm:w-auto sm:min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Артысты</p>
            <p className="mt-2 font-display text-xl font-semibold tabular-nums">
              {cat.artists_published} / {cat.artists_total}
            </p>
            <Users className="absolute right-3 top-3 h-4 w-4 text-sky-600/80 dark:text-sky-400/80" strokeWidth={1.5} />
          </div>
          <div className="relative overflow-hidden rounded-2xl border bg-card/40 p-4 border-border/80 shadow-sm shrink-0 w-[min(100%,10rem)] snap-start sm:w-auto sm:min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Трэкі</p>
            <p className="mt-2 font-display text-xl font-semibold tabular-nums">{cat.tracks_total.toLocaleString("be-BY")}</p>
            <Music className="absolute right-3 top-3 h-4 w-4 text-primary/80" strokeWidth={1.5} />
          </div>
          <div className="relative overflow-hidden rounded-2xl border bg-card/40 p-4 border-border/80 shadow-sm shrink-0 w-[min(100%,10rem)] snap-start sm:w-auto sm:min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Альбомы</p>
            <p className="mt-2 font-display text-xl font-semibold tabular-nums">{cat.albums_total.toLocaleString("be-BY")}</p>
            <Disc className="absolute right-3 top-3 h-4 w-4 text-teal-600/80 dark:text-teal-400/80" strokeWidth={1.5} />
          </div>
          <div className="relative overflow-hidden rounded-2xl border bg-card/40 p-4 border-border/80 shadow-sm shrink-0 w-[min(100%,10rem)] snap-start sm:w-auto sm:min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Мадэрацыя</p>
            <p className="mt-2 font-display text-xl font-semibold tabular-nums">
              {cat.releases_in_moderation.toLocaleString("be-BY")}
            </p>
            <Inbox className="absolute right-3 top-3 h-4 w-4 text-amber-600/80 dark:text-amber-400/80" strokeWidth={1.5} />
          </div>
          <Link
            href="/admin/label/distribution"
            className="relative overflow-hidden rounded-2xl border bg-card/40 p-4 border-border/80 shadow-sm shrink-0 w-[min(100%,10rem)] snap-start sm:w-auto sm:min-w-0 flex flex-col justify-center hover:border-primary/30 transition-colors lg:col-span-2"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Дыстрыбуцыя</p>
            <p className="mt-1 text-sm font-medium text-primary">Заяўкі →</p>
          </Link>
        </div>
      ) : null}

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
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass rounded-2xl border border-border p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Топ артыстаў</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Па сесіях за перыяд (усяго лэйбла)</p>
            {data.artists && data.artists.length > 0 ? (
              <TopArtistsPanel
                artists={data.artists}
                selectedId={filterArtistId}
                onSelect={(id) => setFilterArtistId(id)}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Няма даных.</p>
            )}
          </div>
          <div className="glass rounded-2xl border border-border p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Топ трэкаў</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              {filterArtistId ? "У межах абранага артыста" : "Увесь каталог"}
            </p>
            {data.tracks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Няма трэкаў у каталогу.</p>
            ) : (
              <TopTracksPanel tracks={data.tracks} onSelectTrack={(t) => setTrackDialogId(t.id)} />
            )}
          </div>
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
