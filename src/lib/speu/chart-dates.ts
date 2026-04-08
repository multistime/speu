/** Каляндарныя даты (YYYY-MM-DD) у Europe/Minsk */

export function minskTodayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Minsk",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** `days` каляндарных сутак раней за `ymd` (у тым жа поясе). */
export function minskYmdMinusDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const u = Date.UTC(y, m - 1, d, 12, 0, 0) - days * 86400000;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Minsk",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(u));
}
