import { describe, expect, it } from "vitest";
import { parseArtistListenDashboard, parseTrackListenDashboard } from "./artist-analytics";

describe("parseArtistListenDashboard", () => {
  const base = {
    ok: true,
    period_days: 28,
    range: { start: "2026-04-01", end: "2026-04-28" },
    prev_range: { start: "2026-03-04", end: "2026-03-31" },
    summary: {
      full_listens: 1,
      partial_listens: 2,
      total_sessions: 3,
      unique_listeners: 4,
      prev_full_listens: 0,
      prev_partial_listens: 0,
      prev_total_sessions: 0,
      prev_unique_listeners: 0,
    },
    daily: [],
    tracks: [] as Record<string, unknown>[],
  };

  it("defaults analytics_eligible to true when field omitted", () => {
    const raw = {
      ...base,
      tracks: [
        {
          id: "a",
          title: "T",
          slug: "t",
          like_count: 0,
          period_full: 0,
          period_partial: 0,
          all_full: 0,
          all_partial: 0,
        },
      ],
    };
    const p = parseArtistListenDashboard(raw);
    expect(p?.ok).toBe(true);
    if (p?.ok) {
      expect(p.tracks[0].analytics_eligible).toBe(true);
    }
  });

  it("parses analytics_eligible false", () => {
    const raw = {
      ...base,
      tracks: [
        {
          id: "a",
          title: "T",
          slug: null,
          like_count: 0,
          period_full: 0,
          period_partial: 0,
          all_full: 0,
          all_partial: 0,
          analytics_eligible: false,
        },
      ],
    };
    const p = parseArtistListenDashboard(raw);
    expect(p?.ok).toBe(true);
    if (p?.ok) {
      expect(p.tracks[0].analytics_eligible).toBe(false);
    }
  });
});

describe("parseTrackListenDashboard", () => {
  it("defaults track.analytics_eligible to true when omitted", () => {
    const raw = {
      ok: true,
      period_days: 7,
      range: { start: "2026-04-01", end: "2026-04-07" },
      prev_range: { start: "2026-03-25", end: "2026-03-31" },
      daily: [],
      track: { id: "x", title: "Y" },
    };
    const p = parseTrackListenDashboard(raw);
    expect(p?.ok).toBe(true);
    if (p?.ok) {
      expect(p.track.analytics_eligible).toBe(true);
    }
  });

  it("parses track.analytics_eligible false", () => {
    const raw = {
      ok: true,
      period_days: 7,
      range: { start: "2026-04-01", end: "2026-04-07" },
      prev_range: { start: "2026-03-25", end: "2026-03-31" },
      daily: [],
      track: { id: "x", title: "Y", analytics_eligible: false },
    };
    const p = parseTrackListenDashboard(raw);
    expect(p?.ok).toBe(true);
    if (p?.ok) {
      expect(p.track.analytics_eligible).toBe(false);
    }
  });
});
