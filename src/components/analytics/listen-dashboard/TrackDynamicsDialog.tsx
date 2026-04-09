"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Loader2, X } from "lucide-react";
import { parseTrackListenDashboard, type TrackListenDashboardOk } from "@/lib/speu/artist-analytics";
import { ListenDailyLineChart } from "./ListenDailyLineChart";
import type { ListenChartAccent } from "./ListenDailyLineChart";

export function TrackDynamicsDialog({
  open,
  onClose,
  trackId,
  periodDays,
  supabase,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  trackId: string | null;
  periodDays: number;
  supabase: SupabaseClient;
  accent: ListenChartAccent;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<TrackListenDashboardOk | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !trackId) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setErr(null);
      const { data: raw, error } = await supabase.schema("speu").rpc("track_listen_dashboard", {
        p_track_id: trackId,
        p_period_days: periodDays,
      });
      if (cancelled) return;
      if (error) {
        setErr(error.message);
        setData(null);
        setLoading(false);
        return;
      }
      const parsed = parseTrackListenDashboard(raw);
      if (!parsed || !parsed.ok) {
        setErr(
          parsed?.error === "forbidden"
            ? "Няма доступу."
            : parsed?.error === "not_found"
              ? "Трэк не знойдзены."
              : "Не ўдалося загрузіць даныя.",
        );
        setData(null);
      } else {
        setData(parsed);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, trackId, periodDays, supabase]);

  const title = useMemo(() => data?.track.title ?? "Трэк", [data]);

  return (
    <dialog
      ref={ref}
      className="fixed left-1/2 top-1/2 z-50 w-[min(100%,36rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-0 shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Дынаміка сесій па днях за абраны перыяд</p>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
          aria-label="Зачыніць"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
          </div>
        ) : err ? (
          <p className="text-sm text-destructive py-8 text-center">{err}</p>
        ) : data ? (
          <ListenDailyLineChart
            days={data.daily}
            rangeStart={data.range.start}
            rangeEnd={data.range.end}
            accent={accent}
          />
        ) : null}
      </div>
    </dialog>
  );
}
