"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import type { SpeuHubArtistCard, SpeuPublicTrack } from "@/lib/speu/types";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import { SpeuHeroShuffle } from "@/components/speu/SpeuHeroShuffle";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { SpeuArtistCardCompact } from "@/components/speu/SpeuArtistCardCompact";

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

        {/* Папулярнае (топ-10) */}
        <section className="mt-6 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground italic">
                У топе
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Парадак: адзнака на радыё ў каталозе, затым нумар сартавання і дата.
              </p>
            </div>
            <Link
              href="/speu/top-100"
              className="text-sm font-medium text-primary hover:underline shrink-0"
            >
              Увесь топ — 100 трэкаў
            </Link>
          </div>

          {chartPreview.length === 0 ? (
            <div className="glass rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
              <Music className="h-8 w-8 mx-auto mb-3 opacity-25" strokeWidth={1} />
              Трэкі з&apos;явяцца тут пасля публікацыі.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
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
              Каталог артыстаў (поўны)
            </Link>
          </div>

          {artists.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Няма артыстаў у базе.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {artists.map((a, i) => (
                <SpeuArtistCardCompact key={a.slug} artist={a} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
