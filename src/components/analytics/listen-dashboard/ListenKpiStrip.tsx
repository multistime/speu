"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListenSparkline } from "./ListenSparkline";
import type { ArtistListenDailyPoint } from "@/lib/speu/artist-analytics";

export type ListenKpiAccent = "emerald" | "primary";

const ACCENTS: Record<
  ListenKpiAccent,
  { blob: string; icon: string; deltaUp: string; deltaDown: string; deltaNew: string }
> = {
  emerald: {
    blob: "bg-emerald-500/35",
    icon: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    deltaUp: "text-emerald-600 dark:text-emerald-400",
    deltaDown: "text-rose-600 dark:text-rose-400",
    deltaNew: "text-sky-600 dark:text-sky-400",
  },
  primary: {
    blob: "bg-primary/35",
    icon: "border-primary/30 bg-primary/10 text-primary",
    deltaUp: "text-emerald-600 dark:text-emerald-400",
    deltaDown: "text-rose-600 dark:text-rose-400",
    deltaNew: "text-sky-600 dark:text-sky-400",
  },
};

export type KpiItem = {
  key: string;
  title: string;
  value: string;
  delta?: { label: string; tone: "up" | "down" | "flat" | "new" };
  icon: LucideIcon;
  accentKey: keyof typeof CARD_ACCENTS;
  compactValue?: boolean;
  sparkline?: { daily: ArtistListenDailyPoint[]; rangeStart: string; rangeEnd: string; series: "total" | "full" };
  /** Клік па картачцы (метадалогія, дынаміка трэку і г.д.) */
  onPress?: () => void;
};

const CARD_ACCENTS = {
  emerald: { blob: "bg-emerald-500/35", icon: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  sky: { blob: "bg-sky-500/35", icon: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  teal: { blob: "bg-teal-500/35", icon: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  amber: { blob: "bg-amber-500/35", icon: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  primary: { blob: "bg-primary/35", icon: "border-primary/30 bg-primary/10 text-primary" },
} as const;

function ListenKpiCard({
  title,
  value,
  delta,
  icon: Icon,
  cardAccent,
  theme,
  compactValue,
  sparkline,
  onPress,
}: {
  title: string;
  value: string;
  delta?: { label: string; tone: "up" | "down" | "flat" | "new" };
  icon: LucideIcon;
  cardAccent: keyof typeof CARD_ACCENTS;
  theme: ListenKpiAccent;
  compactValue?: boolean;
  sparkline?: { daily: ArtistListenDailyPoint[]; rangeStart: string; rangeEnd: string; series: "total" | "full" };
  onPress?: () => void;
}) {
  const a = CARD_ACCENTS[cardAccent];
  const t = ACCENTS[theme];
  const interactive = Boolean(onPress);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card/40 p-4 border-border/80 shadow-sm shrink-0 w-[min(100%,11.5rem)] snap-start sm:w-auto sm:min-w-0 sm:shrink",
        interactive && "cursor-pointer hover:border-border active:scale-[0.99] transition-[border,transform]",
      )}
      onClick={onPress}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPress?.();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.14] blur-2xl", a.blob)} />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground pr-1">{title}</p>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", a.icon)}>
          <Icon className="h-4 w-4 opacity-90" strokeWidth={1.5} />
        </div>
      </div>
      <p
        className={cn(
          "relative mt-2 font-display font-semibold tracking-tight text-foreground tabular-nums",
          compactValue ? "text-base leading-snug line-clamp-2 min-h-[2.5rem]" : "text-2xl",
        )}
      >
        {value}
      </p>
      {delta && (
        <p className="relative mt-2 text-[10px] leading-tight">
          <span className="text-muted-foreground">vs папяр.: </span>
          <span
            className={cn(
              "font-medium tabular-nums",
              delta.tone === "up" && t.deltaUp,
              delta.tone === "down" && t.deltaDown,
              delta.tone === "flat" && "text-muted-foreground",
              delta.tone === "new" && t.deltaNew,
            )}
          >
            {delta.label}
          </span>
        </p>
      )}
      {sparkline ? (
        <ListenSparkline
          daily={sparkline.daily}
          rangeStart={sparkline.rangeStart}
          rangeEnd={sparkline.rangeEnd}
          accent={theme === "emerald" ? "emerald" : "primary"}
          series={sparkline.series}
        />
      ) : null}
    </div>
  );
}

export function ListenKpiStrip({
  items,
  theme,
}: {
  items: KpiItem[];
  theme: ListenKpiAccent;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 xl:grid-cols-4",
        "[scrollbar-width:thin]",
      )}
    >
      {items.map((it) => (
        <ListenKpiCard
          key={it.key}
          title={it.title}
          value={it.value}
          delta={it.delta}
          icon={it.icon}
          cardAccent={it.accentKey}
          theme={theme}
          compactValue={it.compactValue}
          sparkline={it.sparkline}
          onPress={it.onPress}
        />
      ))}
    </div>
  );
}
