"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ExternalLink, MapPin, Music } from "lucide-react";
import { ArtistPattern } from "@/components/artists/artist-pattern";
import type { SpeuArtistPageData } from "@/lib/speu/types";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import {
  SpeuInstagramIcon,
  SpeuSpotifyIcon,
  SpeuTelegramIcon,
  SpeuYoutubeIcon,
} from "@/components/speu/speu-social-icons";

export function SpeuArtistPageView({ data }: { data: SpeuArtistPageData }) {
  const { instagram, youtube, spotify, telegram } = data.socials;
  const hasSocials = [instagram, youtube, spotify, telegram].some(
    (u) => typeof u === "string" && u.length > 1
  );
  const { gradientFrom, gradientTo, accent, accentRgb, pattern } = data.theme;

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Левая калонка: вокладка / інфа + альбомы */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl lg:sticky lg:top-28"
              style={{ boxShadow: `0 0 60px rgba(${accentRgb}, 0.1)` }}
            >
              <div
                className="relative h-52 sm:h-56 overflow-hidden"
                style={{
                  background: `linear-gradient(160deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
                }}
              >
                <ArtistPattern pattern={pattern} accent={accent} />
                <div
                  className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-40"
                  style={{ background: accent }}
                />
                <div className="absolute inset-0 flex items-end p-5">
                  <div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {data.genres.map((g) => (
                        <span
                          key={g}
                          className="text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
                          style={{
                            background: `rgba(${accentRgb}, 0.25)`,
                            color: accent,
                            border: `1px solid rgba(${accentRgb}, 0.4)`,
                          }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    <h1 className="font-display text-3xl font-semibold text-white italic leading-tight">
                      {data.name}
                    </h1>
                    <p className="text-white/60 text-sm mt-0.5">{data.nameEn}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />
                    {data.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" strokeWidth={1.5} />
                    З {data.year}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.bio}</p>

                {hasSocials && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
                    <span className="text-xs text-muted-foreground/50 mr-1">Сачыць:</span>
                    {instagram && instagram.length > 1 && (
                      <a
                        href={instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
                        aria-label="Instagram"
                      >
                        <SpeuInstagramIcon className="h-4 w-4" />
                      </a>
                    )}
                    {youtube && youtube.length > 1 && (
                      <a
                        href={youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
                        aria-label="YouTube"
                      >
                        <SpeuYoutubeIcon className="h-4 w-4" />
                      </a>
                    )}
                    {spotify && spotify.length > 1 && (
                      <a
                        href={spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
                        aria-label="Spotify"
                      >
                        <SpeuSpotifyIcon className="h-4 w-4" />
                      </a>
                    )}
                    {telegram && telegram.length > 1 && (
                      <a
                        href={telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
                        aria-label="Telegram"
                      >
                        <SpeuTelegramIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                <Link
                  href="/artists"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                  Рэферэнс у каталозе
                </Link>
              </div>
            </motion.div>

            {/* Альбомы */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-4 font-medium">
                Альбомы
              </h2>
              {data.albums.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пакуль без альбомаў у каталозе.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.albums.map((al) => (
                    <Link
                      key={al.id}
                      href={`/speu/albums/${al.slug}`}
                      className="group rounded-xl border border-border overflow-hidden bg-card hover:border-primary/25 transition-all"
                    >
                      <div
                        className="aspect-square relative bg-muted"
                        style={{
                          background: al.coverUrl
                            ? undefined
                            : `linear-gradient(160deg, ${gradientFrom}88 0%, ${gradientTo} 100%)`,
                        }}
                      >
                        {al.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={al.coverUrl}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Music className="size-8 opacity-25" style={{ color: accent }} />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {al.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Правая калонка: трэкі */}
          <div className="lg:col-span-8">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-4 font-medium">
              Усе трэкі
            </h2>
            {data.tracks.length === 0 ? (
              <div className="glass rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
                <Music className="h-8 w-8 mx-auto mb-3 opacity-25" />
                Няма апублікаваных трэкаў з гэтым артыстам.
              </div>
            ) : (
              <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-2 sm:p-3">
                {data.tracks.map((t, i) => (
                  <SpeuTrackRow key={t.id} track={t} index={i} showCover />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
