"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import type { SpeuHubArtistCard, SpeuPublicTrack } from "@/lib/speu/types";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import { SpeuHeroShuffle } from "@/components/speu/SpeuHeroShuffle";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { SpeuArtistCardCompact } from "@/components/speu/SpeuArtistCardCompact";
import { cn } from "@/lib/utils";

type SpeuHubClientProps = {
  playable: SpeuPublicTrack[];
  artists: SpeuHubArtistCard[];
};

export function SpeuHubClient({ playable, artists }: SpeuHubClientProps) {
  const playerTracks = playable.map(speuPublicTrackToPlayerTrack);
  const chartPreview = playable.slice(0, 10);
  const leftCol = chartPreview.filter((_, i) => i % 2 === 0);
  const rightCol = chartPreview.filter((_, i) => i % 2 === 1);

  return (
    <div className="min-h-screen pt-28 pb-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-6"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-4 font-medium">
            Струмень
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-4 leading-tight italic">
            Спеў
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Каталог лейбла: слухайце ўсе апублікаваныя трэкі, адкрывайце артыстаў, альбомы і асобныя кампазіцыі.
          </p>
        </motion.div>

        <SpeuHeroShuffle tracks={playerTracks} playableCount={playable.length} />

        {/* Лепшае (топ-10) */}
        <section className="mt-2 mb-16">
          <div className="flex flex-row items-baseline justify-between gap-4 mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground italic">
              Лепшае
            </h2>
            <Link
              href="/speu/top-100"
              className="text-sm font-medium text-primary hover:underline shrink-0 text-right"
            >
              Папулярнае
            </Link>
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
                  <SpeuTrackRow key={t.id} track={t} index={i} showCover />
                ))}
              </div>
              <div className="hidden md:grid md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-0.5">
                  {leftCol.map((t, i) => (
                    <SpeuTrackRow key={t.id} track={t} index={i * 2} showCover />
                  ))}
                </div>
                <div className="space-y-0.5">
                  {rightCol.map((t, i) => (
                    <SpeuTrackRow key={t.id} track={t} index={i * 2 + 1} showCover />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Артысты */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground italic">
              Артысты
            </h2>
            <Link
              href="/artists"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              Усе артысты
            </Link>
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
