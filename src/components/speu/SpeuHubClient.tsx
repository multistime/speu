"use client";

import { motion } from "framer-motion";
import { useMemo, type CSSProperties } from "react";
import { Music } from "lucide-react";
import type { SpeuHubArtistCard, SpeuPublicTrack } from "@/lib/speu/types";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import { SpeuHeroShuffle } from "@/components/speu/SpeuHeroShuffle";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { SpeuArtistCardCompact } from "@/components/speu/SpeuArtistCardCompact";
import { SpeuInlineNavLink } from "@/components/speu/SpeuInlineNavLink";
import { cn } from "@/lib/utils";

type SpeuHubClientProps = {
  playable: SpeuPublicTrack[];
  artists: SpeuHubArtistCard[];
  /** Залайканыя трэкі (толькі для аўтарызаваных); пуста — секцыя не паказваецца */
  likedPreview: SpeuPublicTrack[];
  /** 1–5 з адмінкі: памер пластыны, 1 = мінімум */
  heroDiscScale?: number;
};

/**
 * Асіметрычнае наслаенне: менш уверх на тыпаграфіку, больш уніз на «Лепшае»,
 * каб цэнтр пластыны (плей) візуальна бліжэй да сярэдзіны між блокам A і B.
 */
function hubHeroOverlapStyle(level: number): CSSProperties {
  const L = Math.min(5, Math.max(1, Math.round(level)));
  const t = (L - 1) / 4;
  return {
    ["--speu-hero-pull-mt" as string]: `${-(0.3 + t * 1.05)}rem`,
    ["--speu-hero-pull-mt-sm" as string]: `${-(0.45 + t * 1.35)}rem`,
    ["--speu-hero-pull-mb" as string]: `${-(1.65 + t * 2.45)}rem`,
    ["--speu-hero-pull-mb-sm" as string]: `${-(2 + t * 2.95)}rem`,
  } as CSSProperties;
}

export function SpeuHubClient({
  playable,
  artists,
  likedPreview,
  heroDiscScale = 1,
}: SpeuHubClientProps) {
  const playerTracks = playable.map(speuPublicTrackToPlayerTrack);
  const chartPreview = useMemo(() => playable.slice(0, 10), [playable]);
  const chartPlaylist = useMemo(
    () => chartPreview.map(speuPublicTrackToPlayerTrack),
    [chartPreview]
  );
  const likedPlaylist = useMemo(
    () => likedPreview.map(speuPublicTrackToPlayerTrack),
    [likedPreview]
  );
  const leftCol = chartPreview.filter((_, i) => i % 2 === 0);
  const rightCol = chartPreview.filter((_, i) => i % 2 === 1);

  const heroPull = useMemo(() => hubHeroOverlapStyle(heroDiscScale), [heroDiscScale]);

  return (
    <div className="min-h-screen pt-20 pb-28 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <section className="relative mb-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-30 text-center px-1 pointer-events-none"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-2 sm:mb-3 font-medium">
              Слухай сваё
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-2 sm:mb-3 leading-tight italic [text-shadow:0_0_1px_var(--background),0_1px_2px_var(--background)]">
              Спеў
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed pb-2 sm:pb-3">
              Слухайце трэкі, адкрывайце артыстаў, альбомы і асобныя кампазіцыі.
            </p>
          </motion.div>

          <div
            className="relative z-10 mt-[var(--speu-hero-pull-mt)] mb-[var(--speu-hero-pull-mb)] sm:mt-[var(--speu-hero-pull-mt-sm)] sm:mb-[var(--speu-hero-pull-mb-sm)]"
            style={heroPull}
          >
            <SpeuHeroShuffle
              tracks={playerTracks}
              playableCount={playable.length}
              scaleLevel={heroDiscScale}
            />
          </div>
        </section>

        {/* Лепшае (топ-10); z вышэй за пластыню — загаловак чытаецца над кольцамі */}
        <section className="relative z-20 mb-16">
          <div className="flex flex-row items-baseline justify-between gap-4 mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground italic">
              Лепшае
            </h2>
            <SpeuInlineNavLink
              href="/speu/top-100"
              className="text-sm font-medium shrink-0 justify-end ml-auto"
            >
              Папулярнае
            </SpeuInlineNavLink>
          </div>

          {chartPreview.length === 0 ? (
            <div className="glass rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
              <Music className="h-8 w-8 mx-auto mb-3 opacity-25" strokeWidth={1} />
              Трэкі з&apos;явяцца тут пасля публікацыі.
            </div>
          ) : (
            <>
              <div className="space-y-0.5 md:hidden">
                {chartPreview.map((t, i) => (
                  <SpeuTrackRow
                    key={t.id}
                    track={t}
                    index={i}
                    showCover
                    playlist={chartPlaylist}
                  />
                ))}
              </div>
              <div className="hidden md:grid md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-0.5">
                  {leftCol.map((t, i) => (
                    <SpeuTrackRow
                      key={t.id}
                      track={t}
                      index={i * 2}
                      showCover
                      playlist={chartPlaylist}
                    />
                  ))}
                </div>
                <div className="space-y-0.5">
                  {rightCol.map((t, i) => (
                    <SpeuTrackRow
                      key={t.id}
                      track={t}
                      index={i * 2 + 1}
                      showCover
                      playlist={chartPlaylist}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Любімае */}
        {likedPreview.length > 0 ? (
          <section className="mt-2 mb-16">
            <div className="flex flex-row items-baseline justify-between gap-4 mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground italic">
                Любімае
              </h2>
              <SpeuInlineNavLink
                href="/speu/liked"
                className="text-sm font-medium shrink-0 justify-end ml-auto"
              >
                Усе
              </SpeuInlineNavLink>
            </div>
            <div className="space-y-0.5 md:hidden">
              {likedPreview.map((t, i) => (
                <SpeuTrackRow
                  key={t.id}
                  track={t}
                  index={i}
                  showCover
                  playlist={likedPlaylist}
                />
              ))}
            </div>
            <div className="hidden md:grid md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-0.5">
                {likedPreview
                  .filter((_, i) => i % 2 === 0)
                  .map((t, i) => (
                    <SpeuTrackRow
                      key={t.id}
                      track={t}
                      index={i * 2}
                      showCover
                      playlist={likedPlaylist}
                    />
                  ))}
              </div>
              <div className="space-y-0.5">
                {likedPreview
                  .filter((_, i) => i % 2 === 1)
                  .map((t, i) => (
                    <SpeuTrackRow
                      key={t.id}
                      track={t}
                      index={i * 2 + 1}
                      showCover
                      playlist={likedPlaylist}
                    />
                  ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Артысты */}
        <section>
          <div className="flex flex-row items-baseline justify-between gap-4 mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground italic">
              Артысты
            </h2>
            <SpeuInlineNavLink href="/artists" className="text-sm font-medium shrink-0 ml-auto">
              Усе
            </SpeuInlineNavLink>
          </div>

          {artists.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Няма артыстаў у базе.</div>
          ) : (
            <div
              className={cn(
                "-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory",
                "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                "md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 md:snap-none",
                "lg:grid-cols-4"
              )}
            >
              {artists.map((a, i) => (
                <div
                  key={a.slug}
                  className="w-[min(18.5rem,calc(100vw-2.5rem))] shrink-0 snap-start md:w-auto md:min-w-0 md:shrink"
                >
                  <SpeuArtistCardCompact artist={a} index={i} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
