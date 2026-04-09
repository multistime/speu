"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Disc,
  ExternalLink,
  Headphones,
  Heart,
  Inbox,
  Loader2,
  Music,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  type ArtistListenDashboardOk,
  deltaPct,
  parseArtistListenDashboard,
} from "@/lib/speu/artist-analytics";
import { cn } from "@/lib/utils";

const PERIODS = [
  { days: 7, label: "7 дзён" },
  { days: 28, label: "28 дзён" },
  { days: 90, label: "90 дзён" },
] as const;

function ymdRangeInclusive(start: string, end: string): string[] {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const out: string[] = [];
  let t = Date.UTC(sy, sm - 1, sd);
  const endT = Date.UTC(ey, em - 1, ed);
  while (t <= endT) {
    const x = new Date(t);
    const ys = x.getUTCFullYear();
    const ms = String(x.getUTCMonth() + 1).padStart(2, "0");
    const ds = String(x.getUTCDate()).padStart(2, "0");
    out.push(`${ys}-${ms}-${ds}`);
    t += 86400000;
  }
  return out;
}

function formatDelta(cur: number, prev: number): { label: string; tone: "up" | "down" | "flat" | "new" } {
  if (prev === 0) {
    if (cur === 0) return { label: "0%", tone: "flat" };
    return { label: "новы перыяд", tone: "new" };
  }
  const p = deltaPct(cur, prev);
  if (p === null) return { label: "—", tone: "flat" };
  const sign = p > 0 ? "+" : "";
  return {
    label: `${sign}${p}%`,
    tone: p > 0 ? "up" : p < 0 ? "down" : "flat",
  };
}

const ACCENTS = {
  primary: { blob: "bg-primary/35", icon: "border-primary/30 bg-primary/10 text-primary" },
  sky: { blob: "bg-sky-500/35", icon: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  teal: { blob: "bg-teal-500/35", icon: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  amber: { blob: "bg-amber-500/35", icon: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
} as const;

function MetricCard({
  title,
  value,
  subtitle,
  delta,
  icon: Icon,
  accent,
  compactValue,
}: {
  title: string;
  value: string;
  subtitle?: string;
  delta?: { label: string; tone: "up" | "down" | "flat" | "new" };
  icon: typeof Headphones;
  accent: keyof typeof ACCENTS;
  compactValue?: boolean;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/40 p-5 border-border/80 shadow-sm">
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.14] blur-2xl", a.blob)} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          <p
            className={cn(
              "mt-2 font-display font-semibold tracking-tight text-foreground",
              compactValue ? "text-lg leading-snug line-clamp-2 min-h-[2.75rem]" : "text-3xl tabular-nums",
            )}
          >
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground leading-snug max-w-[14rem]">{subtitle}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", a.icon)}>
          <Icon className="h-5 w-5 opacity-90" strokeWidth={1.5} />
        </div>
      </div>
      {delta && (
        <p className="relative mt-3 text-xs">
          <span className="text-muted-foreground">да папярэдняга перыяду: </span>
          <span
            className={cn(
              "font-medium tabular-nums",
              delta.tone === "up" && "text-emerald-600 dark:text-emerald-400",
              delta.tone === "down" && "text-rose-600 dark:text-rose-400",
              delta.tone === "flat" && "text-muted-foreground",
              delta.tone === "new" && "text-sky-600 dark:text-sky-400",
            )}
          >
            {delta.label}
          </span>
        </p>
      )}
    </div>
  );
}

function ListenDailyChart({
  days,
  rangeStart,
  rangeEnd,
}: {
  days: ArtistListenDashboardOk["daily"];
  rangeStart: string;
  rangeEnd: string;
}) {
  const filled = useMemo(() => {
    const map = new Map(days.map((p) => [p.d, p]));
    return ymdRangeInclusive(rangeStart, rangeEnd).map((d) => {
      const p = map.get(d);
      return { d, full: p?.full ?? 0, partial: p?.partial ?? 0 };
    });
  }, [days, rangeStart, rangeEnd]);

  const maxVal = useMemo(() => Math.max(1, ...filled.map((x) => x.full + x.partial)), [filled]);

  const w = 720;
  const h = 200;
  const padL = 8;
  const padR = 8;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padB;
  const n = filled.length || 1;
  const barW = Math.max(2, (innerW / n) * 0.62);
  const gap = innerW / n - barW;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="min-w-[min(100%,720px)] w-full text-foreground"
        role="img"
        aria-label="Дынаміка праслухоўванняў па днях"
      >
        <defs>
          <linearGradient id="labelBarPart" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgb(245 158 11)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="rgb(245 158 11)" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        {filled.map((row, i) => {
          const x = padL + i * (barW + gap) + gap / 2;
          const total = row.full + row.partial;
          const totalH = (total / maxVal) * innerH;
          const fullH = total > 0 ? (row.full / total) * totalH : 0;
          const partH = total > 0 ? (row.partial / total) * totalH : 0;
          const yBase = innerH;
          return (
            <g key={row.d}>
              <title>
                {row.d}: поўныя {row.full}, частковыя {row.partial}
              </title>
              <rect
                x={x}
                y={yBase - fullH - partH}
                width={barW}
                height={Math.max(fullH, 0)}
                rx={3}
                className="fill-primary/90"
              />
              <rect
                x={x}
                y={yBase - partH}
                width={barW}
                height={Math.max(partH, 0)}
                rx={3}
                fill="url(#labelBarPart)"
              />
            </g>
          );
        })}
        {filled.length > 0
          ? (() => {
              const nB = filled.length;
              const maxLabels = 9;
              const step = nB <= maxLabels ? 1 : Math.ceil(nB / maxLabels);
              const idxs: number[] = [];
              for (let i = 0; i < nB; i += step) idxs.push(i);
              if (idxs[idxs.length - 1] !== nB - 1) idxs.push(nB - 1);
              return idxs.map((i) => {
                const row = filled[i];
                const x = padL + i * (barW + gap) + gap / 2 + barW / 2;
                const short = row.d.slice(5);
                return (
                  <text
                    key={`t-${row.d}`}
                    x={x}
                    y={h - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px] font-sans"
                  >
                    {short}
                  </text>
                );
              });
            })()
          : null}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-primary/80" />
          Поўнае праслухоўванне
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-amber-500/80" />
          Частковае (з ~15% трэка)
        </span>
      </div>
    </div>
  );
}

function TopTracksBars({ tracks }: { tracks: ArtistListenDashboardOk["tracks"] }) {
  const top = useMemo(() => {
    return [...tracks]
      .sort((a, b) => b.period_full + b.period_partial - (a.period_full + a.period_partial))
      .slice(0, 6);
  }, [tracks]);
  const maxV = Math.max(1, ...top.map((t) => t.period_full + t.period_partial));
  if (top.length === 0) return null;
  return (
    <div className="space-y-3">
      {top.map((t) => {
        const v = t.period_full + t.period_partial;
        const pct = Math.round((v / maxV) * 100);
        return (
          <div key={t.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-foreground">{t.title}</span>
              <span className="tabular-nums text-muted-foreground shrink-0">{v}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/90 to-primary/60"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LabelListenOverviewClient() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["days"]>(28);
  const [data, setData] = useState<ArtistListenDashboardOk | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const { data: raw, error } = await supabase.schema("speu").rpc("label_listen_dashboard", {
      p_period_days: period,
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
  }, [period, supabase]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

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

  const s = data.summary;
  const topTrack = data.tracks[0];
  const sessionsDelta = formatDelta(s.total_sessions, s.prev_total_sessions);
  const uniqueDelta = formatDelta(s.unique_listeners, s.prev_unique_listeners);
  const fullDelta = formatDelta(s.full_listens, s.prev_full_listens);
  const cat = data.catalog;

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
            <BarChart3 className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground italic">Агляд лэйбла</h1>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
              Усе трэкі каталога: сесіі праслухоўванняў, унікальныя слухачы, дынаміка па днях (Мінск) і табліца па
              трэках.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Артысты"
            value={`${cat.artists_published} / ${cat.artists_total}`}
            subtitle="апублікавана / усяго"
            icon={Users}
            accent="sky"
          />
          <MetricCard
            title="Трэкі ў каталозе"
            value={cat.tracks_total.toLocaleString("be-BY")}
            subtitle="artist_tracks"
            icon={Music}
            accent="primary"
          />
          <MetricCard
            title="Альбомы"
            value={cat.albums_total.toLocaleString("be-BY")}
            icon={Disc}
            accent="teal"
          />
          <MetricCard
            title="Заяўкі ў мадэрацыі"
            value={cat.releases_in_moderation.toLocaleString("be-BY")}
            subtitle="submitted / needs_changes"
            icon={Inbox}
            accent="amber"
          />
          <Link
            href="/admin/label/distribution"
            className="relative overflow-hidden rounded-2xl border bg-card/40 p-5 border-border/80 shadow-sm flex flex-col justify-center hover:border-primary/30 transition-colors"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Дыстрыбуцыя</p>
            <p className="mt-2 text-sm font-medium text-primary">Адкрыць заявы →</p>
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Сесіі праслухоўвання"
          value={s.total_sessions.toLocaleString("be-BY")}
          subtitle="Поўныя + частковыя старты за перыяд"
          delta={sessionsDelta}
          icon={Headphones}
          accent="primary"
        />
        <MetricCard
          title="Унікальныя слухачы"
          value={s.unique_listeners.toLocaleString("be-BY")}
          subtitle="Прыблізна па прыладзе / акаўнце"
          delta={uniqueDelta}
          icon={Users}
          accent="sky"
        />
        <MetricCard
          title="Поўныя праслухоўванні"
          value={s.full_listens.toLocaleString("be-BY")}
          subtitle="Даслухалі да канца (па правілах чарта)"
          delta={fullDelta}
          icon={TrendingUp}
          accent="teal"
        />
        <MetricCard
          title="Топ трэк перыяду"
          value={topTrack ? topTrack.title : "—"}
          subtitle={
            topTrack
              ? `${(topTrack.period_full + topTrack.period_partial).toLocaleString("be-BY")} сесій за перыяд`
              : "Пакуль няма даных"
          }
          icon={Heart}
          accent="amber"
          compactValue={Boolean(topTrack)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 glass rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Дынаміка па днях</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {data.range.start} — {data.range.end} · параўнанне з {data.prev_range.start} — {data.prev_range.end}
          </p>
          <ListenDailyChart days={data.daily} rangeStart={data.range.start} rangeEnd={data.range.end} />
        </div>
        <div className="lg:col-span-2 glass rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Топ трэкаў</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Па колькасці сесій за абраны перыяд</p>
          {data.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Няма трэкаў у каталогу.</p>
          ) : (
            <TopTracksBars tracks={data.tracks} />
          )}
        </div>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 bg-card/20">
          <h2 className="text-sm font-semibold text-foreground">Усе трэкі</h2>
          <p className="text-xs text-muted-foreground mt-1">За перыяд і ўсяго (сума поўных і частковых сесій)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Трэк</th>
                <th className="px-3 py-3 font-medium text-right tabular-nums">За перыяд</th>
                <th className="px-3 py-3 font-medium text-right tabular-nums hidden sm:table-cell">Поўн.</th>
                <th className="px-3 py-3 font-medium text-right tabular-nums hidden sm:table-cell">Частк.</th>
                <th className="px-3 py-3 font-medium text-right tabular-nums">Усяго</th>
                <th className="px-5 py-3 font-medium text-right tabular-nums hidden md:table-cell">Лайкі</th>
                <th className="px-4 py-3 w-10" aria-label="Спасылка" />
              </tr>
            </thead>
            <tbody>
              {data.tracks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    Няма трэкаў
                  </td>
                </tr>
              ) : (
                data.tracks.map((t) => {
                  const periodTotal = t.period_full + t.period_partial;
                  const allTotal = t.all_full + t.all_partial;
                  const href = t.slug ? `/speu/tracks/${encodeURIComponent(t.slug)}` : null;
                  return (
                    <tr key={t.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium text-foreground max-w-[12rem] sm:max-w-xs truncate">
                        {t.title}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-foreground">{periodTotal}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {t.period_full}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {t.period_partial}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-foreground">{allTotal}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                        {t.like_count}
                      </td>
                      <td className="px-4 py-3">
                        {href ? (
                          <Link
                            href={href}
                            className="inline-flex text-muted-foreground hover:text-primary"
                            aria-label="Адкрыць трэк"
                          >
                            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                          </Link>
                        ) : (
                          <span className="inline-block w-4" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
