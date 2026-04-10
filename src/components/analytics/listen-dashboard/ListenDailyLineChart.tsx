"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import type { ArtistListenDailyPoint } from "@/lib/speu/artist-analytics";
import { cn } from "@/lib/utils";
import { smoothAreaPath, smoothLineThroughPoints } from "./chart-path";
import { ymdRangeInclusive } from "./shared";

export function ListenDailyLineChart({
  days,
  rangeStart,
  rangeEnd,
  className,
}: {
  days: ArtistListenDailyPoint[];
  rangeStart: string;
  rangeEnd: string;
  className?: string;
}) {
  const uid = useId();
  const gradId = `${uid}-area`;
  const strokeId = `${uid}-line`;

  const filled = useMemo(() => {
    const map = new Map(days.map((p) => [p.d, p]));
    return ymdRangeInclusive(rangeStart, rangeEnd).map((d) => {
      const p = map.get(d);
      return { d, full: p?.full ?? 0, partial: p?.partial ?? 0 };
    });
  }, [days, rangeStart, rangeEnd]);

  const maxVal = useMemo(() => Math.max(1, ...filled.map((x) => x.full + x.partial)), [filled]);

  const w = 720;
  const h = 220;
  const padL = 12;
  const padR = 12;
  const padT = 12;
  const padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const n = filled.length;

  const bottomY = padT + innerH;

  const geometry = useMemo(() => {
    if (n === 0) return { pts: [] as { x: number; y: number; d: string; full: number; partial: number }[], areaD: "", lineD: "" };
    const pts = filled.map((row, i) => {
      const x = n <= 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW;
      const total = row.full + row.partial;
      const y = padT + innerH - (total / maxVal) * innerH;
      return { x, y, d: row.d, full: row.full, partial: row.partial };
    });
    const curvePts = pts.map((p) => ({ x: p.x, y: p.y }));
    const lineD = smoothLineThroughPoints(curvePts);
    const areaD = curvePts.length > 0 ? smoothAreaPath(curvePts, bottomY) : "";
    return { pts, areaD, lineD };
  }, [filled, n, innerW, innerH, maxVal, padL, padT, bottomY]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ idx: number; tipLeft: number; tipTop: number } | null>(null);

  const onSvgMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (n === 0) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * w;
      const clamped = Math.min(Math.max(mx, padL), padL + innerW);
      const t = innerW <= 0 ? 0 : (clamped - padL) / innerW;
      const idx = n <= 1 ? 0 : Math.round(t * (n - 1));
      const p = geometry.pts[idx];
      if (!p) return;
      const wrap = wrapRef.current?.getBoundingClientRect();
      if (!wrap) {
        setHover({ idx, tipLeft: 8, tipTop: 8 });
        return;
      }
      setHover({
        idx,
        tipLeft: e.clientX - wrap.left + 12,
        tipTop: e.clientY - wrap.top - 8,
      });
    },
    [geometry.pts, innerW, n, padL, w],
  );

  const onSvgLeave = useCallback(() => setHover(null), []);

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <div className="w-full overflow-x-auto cursor-crosshair" role="presentation">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="min-w-[min(100%,720px)] w-full touch-none text-foreground outline-none"
          role="img"
          aria-label="Дынаміка праслухоўванняў па днях"
          onMouseMove={onSvgMove}
          onMouseLeave={onSvgLeave}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
            </linearGradient>
          </defs>
          {geometry.areaD ? (
            <path d={geometry.areaD} fill={`url(#${gradId})`} className="transition-opacity" />
          ) : null}
          {geometry.lineD ? (
            <path
              d={geometry.lineD}
              fill="none"
              stroke={`url(#${strokeId})`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
          ) : null}
          {hover && geometry.pts[hover.idx] ? (
            <g className="pointer-events-none">
              <line
                x1={geometry.pts[hover.idx].x}
                y1={padT}
                x2={geometry.pts[hover.idx].x}
                y2={padT + innerH}
                className="stroke-border/80 stroke-primary/40"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <circle
                cx={geometry.pts[hover.idx].x}
                cy={geometry.pts[hover.idx].y}
                r={5}
                className="fill-background"
                stroke="var(--primary)"
                strokeWidth={2}
              />
            </g>
          ) : null}
          {filled.length > 0
            ? (() => {
                const maxLabels = 9;
                const step = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);
                const idxs: number[] = [];
                for (let i = 0; i < n; i += step) idxs.push(i);
                if (idxs[idxs.length - 1] !== n - 1) idxs.push(n - 1);
                return idxs.map((i) => {
                  const row = filled[i];
                  const x = n <= 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW;
                  const short = row.d.slice(5);
                  return (
                    <text
                      key={`t-${row.d}`}
                      x={x}
                      y={h - 6}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px] font-sans pointer-events-none"
                    >
                      {short}
                    </text>
                  );
                });
              })()
            : null}
        </svg>
      </div>
      {hover && geometry.pts[hover.idx] ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] max-w-[calc(100%-1rem)] rounded-lg border border-border/80 bg-card/95 px-2.5 py-2 text-[11px] shadow-md backdrop-blur-sm"
          style={{
            left: `min(calc(100% - 9.5rem), max(0.25rem, ${hover.tipLeft}px))`,
            top: `max(0.25rem, ${hover.tipTop - 72}px)`,
          }}
        >
          <p className="font-medium tabular-nums text-foreground">{geometry.pts[hover.idx].d}</p>
          <p className="text-muted-foreground mt-0.5">
            Усяго:{" "}
            <span className="tabular-nums text-foreground">
              {(geometry.pts[hover.idx].full + geometry.pts[hover.idx].partial).toLocaleString("be-BY")}
            </span>
          </p>
          <p className="text-muted-foreground">
            Поўн.:{" "}
            <span className="tabular-nums text-foreground">{geometry.pts[hover.idx].full.toLocaleString("be-BY")}</span>
            {" · "}
            частк.:{" "}
            <span className="tabular-nums text-foreground">
              {geometry.pts[hover.idx].partial.toLocaleString("be-BY")}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
