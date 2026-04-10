"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Music } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArtistPattern } from "@/components/artists/artist-pattern";
import { SpeuInlineNavLink } from "@/components/speu/SpeuInlineNavLink";
import type { SpeuArtistAlbum, SpeuArtistPageData } from "@/lib/speu/types";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import { SpeuShareButton } from "@/components/speu/SpeuShareButton";
import {
  SpeuInstagramIcon,
  SpeuSpotifyIcon,
  SpeuTelegramIcon,
  SpeuYoutubeIcon,
} from "@/components/speu/speu-social-icons";
import { cn } from "@/lib/utils";
import { getGenreLabelBe } from "@/lib/speu/genre-taxonomy";

function speuTrackCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} трэк`;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${n} трэкі`;
  return `${n} трэкаў`;
}

function speuAlbumCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} альбом`;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${n} альбомы`;
  return `${n} альбомаў`;
}

function TracksSectionHeader({ artistSlug, showAllLink }: { artistSlug: string; showAllLink: boolean }) {
  return (
    <div className="mb-3 flex shrink-0 items-center justify-between gap-3 px-1">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50">Трэкі</h2>
      {showAllLink && (
        <SpeuInlineNavLink
          href={`/speu/artists/${artistSlug}/tracks`}
          className="shrink-0 text-xs font-medium text-primary hover:text-primary"
        >
          Усе трэкі
        </SpeuInlineNavLink>
      )}
    </div>
  );
}

function AlbumsStrip({
  albums,
  artistSlug,
  accent,
  gradientFrom,
  gradientTo,
}: {
  albums: SpeuArtistAlbum[];
  artistSlug: string;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  if (albums.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border/50 px-4 py-5 text-center text-sm text-muted-foreground">
        Пакуль без альбомаў у гэтым праглядзе.
      </section>
    );
  }

  return (
    <section className="min-w-0">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3 font-medium px-1">
        Альбомы
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 scroll-pl-1 scroll-pr-4 [-ms-overflow-style:none] [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
        {albums.map((al) => {
          const href = al.isSingles
            ? `/speu/artists/${artistSlug}/tracks?view=singles`
            : `/speu/albums/${al.slug}`;
          return (
            <Link
              key={al.id}
              href={href}
              className="group w-[7.25rem] shrink-0 rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-md"
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
                  <img src={al.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music className="size-7 opacity-25" style={{ color: accent }} />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {al.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SpeuArtistProfileCard({
  data,
  className,
}: {
  data: SpeuArtistPageData;
  className?: string;
}) {
  const { instagram, youtube, spotify, telegram } = data.socials;
  const hasSocials = [instagram, youtube, spotify, telegram].some(
    (u) => typeof u === "string" && u.length > 1
  );
  const { gradientFrom, gradientTo, accent, accentRgb, pattern } = data.theme;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
        className
      )}
      style={{ boxShadow: `0 0 60px rgba(${accentRgb}, 0.1)` }}
    >
      {data.genres.length > 0 && (
        <div className="border-b border-border/70 bg-muted/15 px-4 py-2.5">
          <div className="flex flex-wrap gap-1.5">
            {data.genres.map((g) => (
              <span
                key={g}
                className="rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm"
                style={{
                  background: `rgba(${accentRgb}, 0.12)`,
                  color: accent,
                  borderColor: `rgba(${accentRgb}, 0.35)`,
                }}
              >
                {getGenreLabelBe(g)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 p-5">
        <div className="flex gap-4 items-start">
          <div
            className={cn(
              "relative size-24 shrink-0 overflow-hidden rounded-xl border border-border/60 sm:size-[7.25rem]",
              !data.photoUrl && "flex items-center justify-center"
            )}
            style={
              !data.photoUrl
                ? { background: `linear-gradient(160deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }
                : undefined
            }
          >
            {data.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <>
                <ArtistPattern pattern={pattern} accent={accent} />
                <Music
                  className="relative z-[1] size-9 opacity-30 sm:size-10"
                  style={{ color: accent }}
                  strokeWidth={1}
                />
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight text-foreground italic sm:text-3xl">
              {data.name}
            </h1>
            {data.location.trim().length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                  {data.location}
                </span>
              </div>
            )}
            {data.tracks.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground/90">
                <span className="tabular-nums">{speuTrackCountLabel(data.tracks.length)}</span>
                {data.albums.length > 0 ? (
                  <>
                    <span className="mx-1.5 text-muted-foreground/35" aria-hidden>
                      ·
                    </span>
                    <span className="tabular-nums">{speuAlbumCountLabel(data.albums.length)}</span>
                  </>
                ) : null}
              </p>
            )}
          </div>
        </div>

        {data.bio.trim().length > 0 && (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.bio}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {hasSocials ? (
              <>
                <span className="mr-1 text-xs text-muted-foreground/60">Сачыць:</span>
                {instagram && instagram.length > 1 && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-muted-foreground/50 transition-all hover:bg-muted hover:text-foreground"
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
                    className="rounded-lg p-2 text-muted-foreground/50 transition-all hover:bg-muted hover:text-foreground"
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
                    className="rounded-lg p-2 text-muted-foreground/50 transition-all hover:bg-muted hover:text-foreground"
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
                    className="rounded-lg p-2 text-muted-foreground/50 transition-all hover:bg-muted hover:text-foreground"
                    aria-label="Telegram"
                  >
                    <SpeuTelegramIcon className="h-4 w-4" />
                  </a>
                )}
              </>
            ) : null}
          </div>
          <SpeuShareButton
            path={`/speu/artists/${data.slug}`}
            title={data.name}
            className="size-10 !min-h-10 !min-w-10 !max-h-10 !max-w-10 !p-0 sm:size-11 sm:!min-h-11 sm:!min-w-11 sm:!max-h-11 sm:!max-w-11"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function SpeuArtistPageView({ data }: { data: SpeuArtistPageData }) {
  const profileColRef = useRef<HTMLDivElement>(null);
  const [tracksColHeight, setTracksColHeight] = useState<number | null>(null);
  const { accent, gradientFrom, gradientTo } = data.theme;

  const singlesTracks = useMemo(() => data.tracks.filter((t) => !t.album), [data.tracks]);
  const hasSingles = singlesTracks.length > 0;
  const singlesCover = useMemo(
    () => singlesTracks.find((t) => t.coverUrl)?.coverUrl ?? null,
    [singlesTracks]
  );

  const albumsForStrip = useMemo(() => {
    const list: SpeuArtistAlbum[] = [...data.albums];
    if (hasSingles) {
      list.push({
        id: "__speu_singles__",
        slug: "",
        title: "Сінглы",
        coverUrl: singlesCover,
        releaseDate: null,
        isSingles: true,
      });
    }
    return list;
  }, [data.albums, hasSingles, singlesCover]);

  useLayoutEffect(() => {
    const wrap = profileColRef.current;
    if (!wrap) return;
    const measure = () => setTracksColHeight(wrap.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const artistPlaylist = useMemo(
    () => data.tracks.map(speuPublicTrackToPlayerTrack),
    [data.tracks]
  );

  return (
    <>
      {/* Мабільны: адна калонка ў стылі старонкі альбома */}
      <div className="min-h-screen pt-20 pb-24 px-3 sm:px-6 lg:hidden">
        <div className="mx-auto max-w-4xl">
          <SpeuArtistProfileCard data={data} className="mb-10" />

          <TracksSectionHeader artistSlug={data.slug} showAllLink={data.tracks.length > 0} />

          <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-1.5 sm:p-3 mb-10">
            {data.tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <Music className="h-8 w-8 opacity-25" />
                Няма апублікаваных трэкаў з гэтым артыстам.
              </div>
            ) : (
              data.tracks.map((t, i) => (
                <SpeuTrackRow key={t.id} track={t} index={i} showCover playlist={artistPlaylist} />
              ))
            )}
          </div>

          <AlbumsStrip
            albums={albumsForStrip}
            artistSlug={data.slug}
            accent={accent}
            gradientFrom={gradientFrom}
            gradientTo={gradientTo}
          />
        </div>
      </div>

      {/* Дэсктоп: сетка — злева картачка + альбомы, справа трэкі той ж вышыні */}
      <div className="box-border hidden min-h-svh pt-20 pb-24 lg:block">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6 items-start">
            <div ref={profileColRef} className="col-span-4 w-full self-start space-y-6">
              <SpeuArtistProfileCard data={data} className="w-full" />
              <AlbumsStrip
                albums={albumsForStrip}
                artistSlug={data.slug}
                accent={accent}
                gradientFrom={gradientFrom}
                gradientTo={gradientTo}
              />
            </div>

            <div
              className="col-span-8 flex min-h-0 flex-col overflow-hidden"
              style={tracksColHeight != null ? { height: tracksColHeight } : undefined}
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <TracksSectionHeader artistSlug={data.slug} showAllLink={data.tracks.length > 0} />
                <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/60 bg-card/30 p-2 sm:p-3">
                  {data.tracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                      <Music className="h-8 w-8 opacity-25" />
                      Няма апублікаваных трэкаў з гэтым артыстам.
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {data.tracks.map((t, i) => (
                        <SpeuTrackRow
                          key={t.id}
                          track={t}
                          index={i}
                          showCover
                          playlist={artistPlaylist}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
