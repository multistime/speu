"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { useSpeuHubData } from "@/contexts/SpeuHubDataContext";
import { GENRE_ENTRIES, getGenreLabelBe } from "@/lib/speu/genre-taxonomy";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import type { SpeuPublicTrack, SpeuTrackWorkKind } from "@/lib/speu/types";
import { cn } from "@/lib/utils";

type FilterKey = "explicit" | "ai" | "live" | "beat" | "podcast" | "audiobook";

const WORK_KIND_FILTERS: { key: FilterKey; label: string; kind: SpeuTrackWorkKind }[] = [
  { key: "beat", label: "Біт", kind: "beat" },
  { key: "podcast", label: "Падкаст", kind: "podcast" },
  { key: "audiobook", label: "Аўдыёкніга", kind: "audiobook" },
];

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function trackMatchesQuery(track: SpeuPublicTrack, q: string): boolean {
  if (!q) return true;
  const hay = `${track.title} ${track.artistLine} ${track.artists.map((a) => a.name).join(" ")}`.toLowerCase();
  return hay.includes(q);
}

export function SpeuSearchClient() {
  const { playable, loading } = useSpeuHubData();
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(() => new Set());
  const [filters, setFilters] = useState<Set<FilterKey>>(() => new Set());

  const debouncedQuery = useDebouncedValue(query.trim().toLowerCase(), 200);

  const toggleGenre = (code: string) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const results = useMemo(() => {
    return playable.filter((track) => {
      if (!trackMatchesQuery(track, debouncedQuery)) return false;
      if (selectedGenres.size > 0 && !track.genres.some((g) => selectedGenres.has(g))) {
        return false;
      }
      if (filters.has("explicit") && !track.isExplicit) return false;
      if (filters.has("ai") && !(track.isAiMusic || track.isAiLyrics)) return false;
      if (filters.has("live") && (track.isAiMusic || track.isAiLyrics)) return false;
      for (const wf of WORK_KIND_FILTERS) {
        if (filters.has(wf.key) && track.workKind !== wf.kind) return false;
      }
      return true;
    });
  }, [playable, debouncedQuery, selectedGenres, filters]);

  const playlist = useMemo(() => results.map(speuPublicTrackToPlayerTrack), [results]);

  const chipClass = (on: boolean) =>
    cn(
      "max-w-full shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors",
      on
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="speu-search-page w-full min-w-0 max-w-full overflow-x-hidden pb-24 px-3 sm:px-6 lg:px-8 touch-manipulation">
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-3 font-medium text-center">
          Спеў
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-6 text-center italic">
          Пошук
        </h1>

        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Назва трэка або артыст…"
            className="speu-no-input-zoom w-full min-w-0 max-w-full rounded-xl border border-border bg-card/60 py-2.5 pl-10 pr-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>

        <div className="mb-4 flex max-w-full flex-wrap gap-1.5 overflow-x-hidden">
          <button type="button" className={chipClass(filters.has("explicit"))} onClick={() => toggleFilter("explicit")}>
            18+
          </button>
          <button type="button" className={chipClass(filters.has("ai"))} onClick={() => toggleFilter("ai")}>
            ІІ
          </button>
          <button type="button" className={chipClass(filters.has("live"))} onClick={() => toggleFilter("live")}>
            Жывы артыст
          </button>
          {WORK_KIND_FILTERS.map((wf) => (
            <button
              key={wf.key}
              type="button"
              className={chipClass(filters.has(wf.key))}
              onClick={() => toggleFilter(wf.key)}
            >
              {wf.label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex max-w-full flex-wrap gap-1.5 max-h-32 overflow-x-hidden overflow-y-auto overscroll-x-none">
          {GENRE_ENTRIES.map((g) => (
            <button
              key={g.code}
              type="button"
              className={chipClass(selectedGenres.has(g.code))}
              onClick={() => toggleGenre(g.code)}
            >
              {getGenreLabelBe(g.code)}
            </button>
          ))}
        </div>

        {loading && playable.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Загрузка каталога…</p>
        ) : results.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            {debouncedQuery || selectedGenres.size > 0 || filters.size > 0
              ? "Нічога не знайшлося."
              : "Увядзіце запыт або абярыце фільтры."}
          </p>
        ) : (
          <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-1.5 sm:p-3">
            {results.map((t, i) => (
              <SpeuTrackRow key={t.id} track={t} index={i} showCover playlist={playlist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
