"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Play } from "lucide-react";
import { ArtistPattern } from "@/components/artists/artist-pattern";
import { getGenreLabelBe } from "@/lib/speu/genre-taxonomy";
import type { SpeuHubArtistCard } from "@/lib/speu/types";

export function SpeuArtistCardCompact({
  artist,
  index,
}: {
  artist: SpeuHubArtistCard;
  index: number;
}) {
  const { gradientFrom, gradientTo, accent, accentRgb, pattern } = artist.theme;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/speu/artists/${artist.slug}`} className="group block cursor-pointer">
        <div className="relative overflow-hidden rounded-xl border border-border hover:border-primary/30 transition-all duration-500 bg-card">
          <div
            className="relative h-36 overflow-hidden"
            style={{
              background: `linear-gradient(160deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
            }}
          >
            <ArtistPattern pattern={pattern} accent={accent} />

            <div
              className="absolute bottom-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-30 transition-opacity duration-500 group-hover:opacity-45"
              style={{ background: accent }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {artist.photoUrl ? (
                <>
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{
                      background: `radial-gradient(ellipse at center, transparent 0%, ${gradientTo}99 100%)`,
                    }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artist.photoUrl}
                    alt={artist.name}
                    className="relative z-[1] w-28 h-28 rounded-full object-cover shadow-xl"
                    style={{
                      borderWidth: 2,
                      borderStyle: "solid",
                      borderColor: `rgba(${accentRgb}, 0.45)`,
                      boxShadow: `0 10px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(${accentRgb}, 0.2)`,
                    }}
                  />
                </>
              ) : (
                <span
                  className="font-display text-5xl font-semibold select-none opacity-20 group-hover:opacity-28 transition-opacity duration-300"
                  style={{ color: accent }}
                >
                  {artist.initial}
                </span>
              )}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{
                  background: `rgba(${accentRgb}, 0.25)`,
                  border: `1px solid rgba(${accentRgb}, 0.4)`,
                }}
              >
                <Play className="h-4 w-4 ml-0.5" style={{ color: accent }} strokeWidth={2} />
              </div>
            </div>

            <div className="absolute top-2 right-2 flex items-center gap-1">
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-md backdrop-blur-sm"
                style={{
                  background: `rgba(${accentRgb}, 0.18)`,
                  border: `1px solid rgba(${accentRgb}, 0.3)`,
                  color: accent,
                }}
              >
                {artist.year}
              </span>
            </div>
          </div>

          <div className="p-3">
            <div className="flex flex-wrap gap-1 mb-1.5">
              {artist.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `rgba(${accentRgb}, 0.1)`,
                    color: accent,
                    border: `1px solid rgba(${accentRgb}, 0.2)`,
                  }}
                >
                  {getGenreLabelBe(g)}
                </span>
              ))}
            </div>

            <h3 className="font-display text-base font-semibold text-foreground italic mb-0.5 leading-tight line-clamp-2">
              {artist.name}
            </h3>

            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mb-2">
              {artist.tagline}
            </p>

            <div className="flex items-center gap-1 text-muted-foreground/50">
              <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
              <span className="text-[10px] truncate">{artist.location}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
