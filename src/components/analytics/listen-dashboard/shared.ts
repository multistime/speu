import { deltaPct } from "@/lib/speu/artist-analytics";

export const LISTEN_PERIODS = [
  { days: 7, label: "7 дзён" },
  { days: 28, label: "28 дзён" },
  { days: 90, label: "90 дзён" },
] as const;

export type ListenPeriodDays = (typeof LISTEN_PERIODS)[number]["days"];

export function ymdRangeInclusive(start: string, end: string): string[] {
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

export function formatListenDelta(
  cur: number,
  prev: number,
): { label: string; tone: "up" | "down" | "flat" | "new" } {
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

