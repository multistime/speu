"use client";

import { useMemo } from "react";
import type { ArtistListenDailyPoint } from "@/lib/speu/artist-analytics";
import { smoothLineThroughPoints } from "./chart-path";
import { ymdRangeInclusive } from "./shared";

export function ListenSparkline({
  daily,
  rangeStart,
  rangeEnd,
  series = "total",
}: {
  daily: ArtistListenDailyPoint[];
  rangeStart: string;
  rangeEnd: string;
  series?: "total" | "full";
}) {
  const { pathD } = useMemo(() => {
    const map = new Map(daily.map((p) => [p.d, p]));
    const filled = ymdRangeInclusive(rangeStart, rangeEnd).map((d) => {
      const p = map.get(d);
      return { d, full: p?.full ?? 0, partial: p?.partial ?? 0 };
    });
    const n = filled.length;
    const w = 120;
    const h = 28;
    const pad = 2;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    if (n === 0) return { pathD: "" };
    const vals = filled.map((row) => (series === "full" ? row.full : row.full + row.partial));
    const maxV = Math.max(1, ...vals);
    const pts = vals.map((v, i) => {
      const x = n <= 1 ? pad + innerW / 2 : pad + (i / (n - 1)) * innerW;
      const y = pad + innerH - (v / maxV) * innerH;
      return { x, y };
    });
    const pathD = smoothLineThroughPoints(pts);
    return { pathD };
  }, [daily, rangeStart, rangeEnd, series]);

  if (!pathD) return null;

  return (
    <svg width={120} height={28} viewBox="0 0 120 28" className="mt-3 w-full max-w-[7.5rem]" aria-hidden>
      <path
        d={pathD}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary"
      />
    </svg>
  );
}
