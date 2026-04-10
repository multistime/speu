"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Music, ExternalLink, MapPin, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/contexts/PlayerContext";
import type { PlayerTrack } from "@/contexts/PlayerContext";
import { ArtistPattern } from "@/components/artists/artist-pattern";
import { parsePatternFromVisual, type ArtistPatternId } from "@/lib/artists/visual-theme";
import { getGenreLabelBe } from "@/lib/speu/genre-taxonomy";

/* ── Artist data ─────────────────────────────────────────────────────── */

interface ArtistTrack {
  title: string;
  audioUrl?: string | null;
}

interface Artist {
  id: string;
  name: string;
  nameEn: string;
  genres: string[];
  tagline: string;
  bio: string;
  tracks: ArtistTrack[];
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  accentRgb: string;
  initial: string;
  year: string;
  location: string;
  /** Прамая спасылка на фота; калі ёсць — паказваем круглы аватар замест літары */
  photoUrl?: string | null;
  socials: { instagram?: string; youtube?: string; spotify?: string; telegram?: string };
  pattern: ArtistPatternId;
}

const PLACEHOLDER_ARTISTS: Artist[] = [
  {
    id: "kupalina",
    name: "Купаліна",
    nameEn: "Kupalina",
    genres: ["Folk", "Electronica"],
    tagline: "Дух Купалля ў электронным гуку",
    bio: "Купаліна спалучае старажытны купальскі фальклор з сучаснай электронікай. Яе трэкі — гэта галасы продкаў у скрынях сінтэзатараў, вогнішчы ў пульсе басу. Кожная кампазіцыя нараджаецца на мяжы паміж старажытным светам і будучыняй.",
    tracks: [
      { title: "Купальская ноч" },
      { title: "Папараць-кветка" },
      { title: "Вада і агонь" },
      { title: "Зялёны дуб" },
    ],
    gradientFrom: "#2B5035",
    gradientTo: "#0E1811",
    accent: "#7DBF9E",
    accentRgb: "125, 191, 158",
    initial: "К",
    year: "2021",
    location: "Мінск",
    socials: { instagram: "#", youtube: "#", spotify: "#" },
    pattern: "fern",
  },
  {
    id: "lyasun",
    name: "Лясун",
    nameEn: "Lyasun",
    genres: ["Dark Ambient", "Post-Rock"],
    tagline: "З глыбіні Белавежскай пушчы",
    bio: "Лясун — дуэт, натхнёны ляснымі духамі беларускага фальклору. Іх музыка — гэта гул старажытных дрэў, шолах лісця і туман над балотам. Двое музыкантаў спалучаюць гітарны пост-рок і амбіентныя лэйеры.",
    tracks: [
      { title: "Пушча" },
      { title: "Начны туман" },
      { title: "Дзікі Лес" },
      { title: "Стары Дуб" },
    ],
    gradientFrom: "#152018",
    gradientTo: "#0A100C",
    accent: "#7DBF9E",
    accentRgb: "125, 191, 158",
    initial: "Л",
    year: "2019",
    location: "Брэст",
    socials: { instagram: "#", spotify: "#", telegram: "#" },
    pattern: "waves",
  },
  {
    id: "vuzel",
    name: "Вузел",
    nameEn: "Vuzel",
    genres: ["Hip-Hop", "Spoken Word"],
    tagline: "Беларускія рыфмы ў сучасным рытме",
    bio: "Вузел — рэпер, які выкарыстоўвае беларускую мову як зброю і інструмент. Яго тэксты — гарадскія гісторыі, пасеяныя ў роднай мове. Беларускі хіп-хоп, які гаворыць праўду.",
    tracks: [
      { title: "Слова" },
      { title: "Горад" },
      { title: "Корань" },
      { title: "Вуліца" },
    ],
    gradientFrom: "#0D2340",
    gradientTo: "#060E1A",
    accent: "#6B92C8",
    accentRgb: "107, 146, 200",
    initial: "В",
    year: "2022",
    location: "Мінск",
    socials: { instagram: "#", youtube: "#", telegram: "#" },
    pattern: "grid",
  },
  {
    id: "rasitsa",
    name: "Расіца",
    nameEn: "Rasitsa",
    genres: ["Dream Pop", "Shoegaze"],
    tagline: "Сны ў насычаным тумане",
    bio: "Расіца стварае паветраную музыку, дзе вакал гучыць як раніцавая расіца — далёка і блізка адначасова. Меланхолія і прыгажосць беларускай прыроды ў кожным гуку. Шугейз-эстэтыка з беларускай душой.",
    tracks: [
      { title: "Расіца" },
      { title: "Туман" },
      { title: "Ранак" },
      { title: "Срэбная ніць" },
    ],
    gradientFrom: "#3A1A10",
    gradientTo: "#1A0808",
    accent: "#D4944A",
    accentRgb: "212, 148, 74",
    initial: "Р",
    year: "2020",
    location: "Гродна",
    socials: { instagram: "#", spotify: "#", youtube: "#" },
    pattern: "circles",
  },
  {
    id: "balota",
    name: "Балота",
    nameEn: "Balota",
    genres: ["Experimental", "Noise"],
    tagline: "Гукавыя ландшафты беларускіх балот",
    bio: "Балота — трыа, якое даследуе гукавыя магчымасці беларускіх прыродных ландшафтаў. Запісы балотных птушак, звону дрэў і туманнай цішы — аснова іх незвычайных кампазіцый.",
    tracks: [
      { title: "Трасавіна" },
      { title: "Крык журавоў" },
      { title: "Глыбіня" },
      { title: "Мох" },
    ],
    gradientFrom: "#2A0D3A",
    gradientTo: "#10061A",
    accent: "#9B6B9B",
    accentRgb: "155, 107, 155",
    initial: "Б",
    year: "2023",
    location: "Полацк",
    socials: { instagram: "#", telegram: "#", spotify: "#" },
    pattern: "spiral",
  },
  {
    id: "zhytnik",
    name: "Жытнік",
    nameEn: "Zhytnik",
    genres: ["Folk Pop", "Indie"],
    tagline: "Жытнёвыя словы для новага пакалення",
    bio: "Жытнік — сольны праект, дзе фальклорныя традыцыі пераплятаюцца з сучасным інды-попам. Мелодыі жытнёвых палёў і рамантыка вёскі ў новай упакоўцы. Музыка для тых, хто памятае карані.",
    tracks: [
      { title: "Жыта" },
      { title: "Летні дождж" },
      { title: "Вёска" },
      { title: "Сенакос" },
    ],
    gradientFrom: "#2A2000",
    gradientTo: "#0E0C00",
    accent: "#C8A830",
    accentRgb: "200, 168, 48",
    initial: "Ж",
    year: "2020",
    location: "Магілёў",
    socials: { instagram: "#", youtube: "#", spotify: "#", telegram: "#" },
    pattern: "diamond",
  },
];

type PublicArtistApiRow = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  genres: string[];
  tagline: string | null;
  bio: string | null;
  location: string | null;
  year_started: number | null;
  initials: string | null;
  photo_url?: string | null;
  social_links: { instagram?: string; youtube?: string; spotify?: string; telegram?: string } | null;
  visual_json: {
    gradientFrom?: string;
    gradientTo?: string;
    accent?: string;
    accentRgb?: string;
    pattern?: string;
  } | null;
  artist_tracks?: Array<{ title: string; audio_url?: string | null }>;
};

function mapPublicArtistRow(item: PublicArtistApiRow): Artist {
  return {
    id: item.slug || item.id,
    name: item.name,
    nameEn: item.name_en ?? item.name,
    genres: item.genres ?? [],
    tagline: item.tagline ?? "",
    bio: item.bio ?? "",
    tracks: (item.artist_tracks ?? []).map((track) => ({
      title: track.title,
      audioUrl: track.audio_url ?? null,
    })),
    gradientFrom: item.visual_json?.gradientFrom ?? "#2B5035",
    gradientTo: item.visual_json?.gradientTo ?? "#0E1811",
    accent: item.visual_json?.accent ?? "#7DBF9E",
    accentRgb: item.visual_json?.accentRgb ?? "125, 191, 158",
    initial: item.initials ?? item.name.charAt(0),
    photoUrl: item.photo_url?.trim() || null,
    year: item.year_started ? String(item.year_started) : "2024",
    location: item.location ?? "Беларусь",
    socials: item.social_links ?? {},
    pattern: parsePatternFromVisual(item.visual_json?.pattern),
  };
}

/* ── Brand SVG icons ─────────────────────────────────────────────────── */

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/* ── Artist card ─────────────────────────────────────────────────────── */

function ArtistCard({ artist, onClick, index }: { artist: Artist; onClick: (a: Artist) => void; index: number }) {
  const hasAudio = artist.tracks.some((t) => t.audioUrl);

  return (
    <motion.div
      layoutId={`card-${artist.id}`}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onClick(artist)}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border hover:border-primary/30 transition-all duration-500 bg-card">
        {/* Photo area */}
        <motion.div
          layoutId={`photo-${artist.id}`}
          className="relative h-60 overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${artist.gradientFrom} 0%, ${artist.gradientTo} 100%)` }}
        >
          <ArtistPattern pattern={artist.pattern} accent={artist.accent} />

          <div
            className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30 transition-opacity duration-500 group-hover:opacity-50"
            style={{ background: artist.accent }}
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {artist.photoUrl ? (
              <>
                <div
                  className="absolute inset-0 opacity-90"
                  style={{
                    background: `radial-gradient(ellipse at center, transparent 0%, ${artist.gradientTo}99 100%)`,
                  }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artist.photoUrl}
                  alt={artist.name}
                  className="relative z-[1] w-[9.5rem] h-[9.5rem] rounded-full object-cover shadow-2xl"
                  style={{
                    borderWidth: 2,
                    borderStyle: "solid",
                    borderColor: `rgba(${artist.accentRgb}, 0.5)`,
                    boxShadow: `0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(${artist.accentRgb}, 0.2)`,
                  }}
                />
              </>
            ) : (
              <span
                className="font-display text-8xl font-semibold select-none opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                style={{ color: artist.accent }}
              >
                {artist.initial}
              </span>
            )}
          </div>

          {/* Play hint on hover */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
              style={{ background: `rgba(${artist.accentRgb}, 0.25)`, border: `1px solid rgba(${artist.accentRgb}, 0.4)` }}
            >
              <Play className="h-5 w-5 ml-0.5" style={{ color: artist.accent }} strokeWidth={2} />
            </div>
          </div>

          {/* Year badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {hasAudio && (
              <span
                className="text-xs px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1"
                style={{
                  background: `rgba(${artist.accentRgb}, 0.18)`,
                  border: `1px solid rgba(${artist.accentRgb}, 0.3)`,
                  color: artist.accent,
                }}
              >
                <Music className="h-2.5 w-2.5" strokeWidth={1.5} />
              </span>
            )}
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-md backdrop-blur-sm"
              style={{
                background: `rgba(${artist.accentRgb}, 0.18)`,
                border: `1px solid rgba(${artist.accentRgb}, 0.3)`,
                color: artist.accent,
              }}
            >
              {artist.year}
            </span>
          </div>
        </motion.div>

        {/* Info */}
        <div className="p-4">
          <motion.div layoutId={`genres-${artist.id}`} className="flex flex-wrap gap-1 mb-2">
            {artist.genres.map((g) => (
              <span
                key={g}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: `rgba(${artist.accentRgb}, 0.1)`,
                  color: artist.accent,
                  border: `1px solid rgba(${artist.accentRgb}, 0.2)`,
                }}
              >
                {getGenreLabelBe(g)}
              </span>
            ))}
          </motion.div>

          <motion.h3
            layoutId={`name-${artist.id}`}
            className="font-display text-xl font-semibold text-foreground italic mb-1"
          >
            {artist.name}
          </motion.h3>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {artist.tagline}
          </p>

          <div className="flex items-center gap-1 mt-3 text-muted-foreground/50">
            <MapPin className="h-3 w-3" strokeWidth={1.5} />
            <span className="text-xs">{artist.location}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Mini equalizer (playing track indicator) ───────────────────────── */

function TrackPlayingEqualizer({ color }: { color: string }) {
  const bars = 4;
  return (
    <div
      className="flex items-end justify-end gap-0.5 h-3.5 w-[18px] shrink-0 ml-auto"
      aria-hidden
    >
      {Array.from({ length: bars }, (_, i) => (
        <motion.div
          key={i}
          className="w-[2px] h-3.5 rounded-full origin-bottom"
          style={{ backgroundColor: color }}
          animate={{
            scaleY: [0.35, 1, 0.5, 0.85, 0.35],
          }}
          transition={{
            duration: 0.55 + i * 0.12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.07,
          }}
        />
      ))}
    </div>
  );
}

/* ── Track row in modal ──────────────────────────────────────────────── */

function TrackRow({
  track,
  index,
  artist,
}: {
  track: ArtistTrack;
  index: number;
  artist: Artist;
}) {
  const { togglePlay, isTrackActive, isPlaying } = usePlayer();
  const trackId = `${artist.id}-track-${index}`;
  const active = isTrackActive(trackId);
  const playing = active && isPlaying;

  const playerTrack: PlayerTrack = {
    id: trackId,
    title: track.title,
    audioUrl: track.audioUrl ?? "",
    artistName: artist.name,
    accentColor: artist.accent,
    accentRgb: artist.accentRgb,
  };

  const canPlay = Boolean(track.audioUrl);

  return (
    <div
      onClick={() => canPlay && togglePlay(playerTrack)}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group/track",
        canPlay ? "cursor-pointer hover:bg-muted" : "cursor-default opacity-60"
      )}
      style={active ? { background: `rgba(${artist.accentRgb}, 0.08)` } : undefined}
    >
      <span className="text-xs text-muted-foreground/40 w-4 font-mono shrink-0">{index + 1}</span>

      <div className="shrink-0 w-4 flex items-center justify-center">
        {canPlay ? (
          playing ? (
            <Pause
              className="h-3.5 w-3.5"
              style={{ color: artist.accent }}
              fill="currentColor"
              strokeWidth={0}
            />
          ) : (
            <>
              <Music
                className="h-3 w-3 text-muted-foreground/40 group-hover/track:opacity-0 transition-opacity"
                strokeWidth={1.5}
              />
              <Play
                className="h-3.5 w-3.5 absolute opacity-0 group-hover/track:opacity-100 transition-opacity"
                style={{ color: artist.accent }}
                fill="currentColor"
                strokeWidth={0}
              />
            </>
          )
        ) : (
          <Music className="h-3 w-3 text-muted-foreground/40" strokeWidth={1.5} />
        )}
      </div>

      <span
        className={cn("text-sm flex-1 min-w-0 truncate", active ? "font-medium" : "text-foreground/80")}
        style={active ? { color: artist.accent } : undefined}
      >
        {track.title}
      </span>

      {canPlay && playing && <TrackPlayingEqualizer color={artist.accent} />}

      {canPlay && !playing && (
        <Play
          className="h-3 w-3 ml-auto opacity-0 group-hover/track:opacity-60 transition-opacity shrink-0"
          style={{ color: artist.accent }}
          strokeWidth={2}
        />
      )}
    </div>
  );
}

/* ── Artist modal ────────────────────────────────────────────────────── */

function ArtistModal({ artist, onClose }: { artist: Artist; onClose: () => void }) {
  const { instagram, youtube, spotify, telegram } = artist.socials;
  const hasSocials = [instagram, youtube, spotify, telegram].some(
    (u) => typeof u === "string" && u.length > 1
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-md z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          layoutId={`card-${artist.id}`}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl my-4"
          style={{ boxShadow: `0 0 80px rgba(${artist.accentRgb}, 0.12)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-background/40 backdrop-blur-sm border border-border/50 text-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <motion.div
            layoutId={`photo-${artist.id}`}
            className="relative h-52 overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${artist.gradientFrom} 0%, ${artist.gradientTo} 100%)` }}
          >
            <ArtistPattern pattern={artist.pattern} accent={artist.accent} />

            <div
              className="absolute bottom-0 right-0 w-52 h-52 rounded-full blur-3xl opacity-40"
              style={{ background: artist.accent }}
            />
            <div
              className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20"
              style={{ background: artist.accent }}
            />

            {artist.photoUrl && (
              <div className="absolute top-4 left-4 z-[2] pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artist.photoUrl}
                  alt={artist.name}
                  className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white/25"
                />
              </div>
            )}

            <div className="absolute inset-0 flex items-end p-5">
              <div>
                <motion.div layoutId={`genres-${artist.id}`} className="flex flex-wrap gap-1 mb-2">
                  {artist.genres.map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
                      style={{
                        background: `rgba(${artist.accentRgb}, 0.25)`,
                        color: artist.accent,
                        border: `1px solid rgba(${artist.accentRgb}, 0.4)`,
                      }}
                    >
                      {getGenreLabelBe(g)}
                    </span>
                  ))}
                </motion.div>
                <motion.h2
                  layoutId={`name-${artist.id}`}
                  className="font-display text-3xl font-semibold text-white italic"
                >
                  {artist.name}
                </motion.h2>
                <p className="text-white/60 text-sm mt-0.5">{artist.nameEn}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="p-5"
          >
            <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                {artist.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                З {artist.year}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-5">{artist.bio}</p>

            {/* Tracks */}
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3 font-medium">
                Трэкі
              </p>
              <div className="space-y-0.5">
                {artist.tracks.map((track, i) => (
                  <TrackRow key={i} track={track} index={i} artist={artist} />
                ))}
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 pt-4 border-t border-border flex-wrap">
              {hasSocials && (
                <>
                  <span className="text-xs text-muted-foreground/50 mr-1">Сачыць:</span>
                  {instagram && instagram.length > 1 && (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
                      aria-label="Instagram"
                    >
                      <InstagramIcon className="h-4 w-4" />
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
                      <YoutubeIcon className="h-4 w-4" />
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
                      <SpotifyIcon className="h-4 w-4" />
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
                      <TelegramIcon className="h-4 w-4" />
                    </a>
                  )}
                </>
              )}
              <a
                href="#"
                className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  borderColor: `rgba(${artist.accentRgb}, 0.3)`,
                  color: artist.accent,
                }}
              >
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                Старонка
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function ArtistsPage() {
  const [selected, setSelected] = useState<Artist | null>(null);
  const [activeGenre, setActiveGenre] = useState("Усе");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [pageStatus, setPageStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadNonce, setLoadNonce] = useState(0);

  const loadArtistsPage = useCallback(async (signal: AbortSignal) => {
    setPageStatus("loading");
    try {
      let usePlaceholder = false;
      try {
        const settingsRes = await fetch("/api/public/site-settings?key=artists_show_placeholder", {
          signal,
        });
        const settingsJson = settingsRes.ok
          ? ((await settingsRes.json().catch(() => ({}))) as { settings?: Record<string, string> })
          : {};
        if (signal.aborted) return;
        // Як у адмінцы: заглушка ўключана, пакуль значэнне не роўна "false"
        usePlaceholder =
          settingsRes.ok && settingsJson.settings?.artists_show_placeholder !== "false";
      } catch {
        if (signal.aborted) return;
        // Не ўдалося прачытаць налады — паказваем дадзеныя з БД, а не заглушку
        usePlaceholder = false;
      }

      if (usePlaceholder) {
        setArtists(PLACEHOLDER_ARTISTS);
        setPageStatus("ready");
        return;
      }

      const artistsRes = await fetch("/api/public/artists", { signal });
      if (signal.aborted) return;
      if (!artistsRes.ok) {
        setArtists([]);
        setPageStatus("error");
        return;
      }
      const artistsJson = (await artistsRes.json()) as { items?: PublicArtistApiRow[] };
      if (signal.aborted) return;
      const items = artistsJson.items ?? [];
      setArtists(items.map(mapPublicArtistRow));
      setPageStatus("ready");
    } catch {
      if (signal.aborted) return;
      setArtists([]);
      setPageStatus("error");
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void loadArtistsPage(ac.signal);
    return () => ac.abort();
  }, [loadArtistsPage, loadNonce]);

  const filtered =
    activeGenre === "Усе"
      ? artists
      : artists.filter((a) => a.genres.includes(activeGenre));

  const uniqueGenres = ["Усе", ...Array.from(new Set(artists.flatMap((a) => a.genres)))];

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-4 font-medium">
            Каталог
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-4 leading-tight italic">
            Артысты Спеў
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Беларускія музыканты, якія ствараюць арыгінальную музыку на роднай мове.
            Ад фолку і электронікі да хіп-хопу і амбіенту.
          </p>
        </motion.div>

        {pageStatus === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-28 text-muted-foreground"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary/70" strokeWidth={1.25} />
            <p className="text-sm">Загружаюцца артысты…</p>
          </motion.div>
        )}

        {pageStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-4 py-24 text-center px-4"
          >
            <Music className="h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
            <p className="text-sm text-muted-foreground max-w-sm">
              Не ўдалося загрузіць спіс артыстаў. Праверце злучэнне і паспрабуйце яшчэ раз.
            </p>
            <button
              type="button"
              onClick={() => setLoadNonce((n) => n + 1)}
              className="text-sm font-medium px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors"
            >
              Паўтарыць
            </button>
          </motion.div>
        )}

        {pageStatus === "ready" && (
          <>
            {/* Genre filter */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-2 mb-12"
            >
              {uniqueGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(genre)}
                  className={cn(
                    "text-xs px-4 py-1.5 rounded-full border transition-all duration-300 font-medium",
                    activeGenre === genre
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {genre === "Усе" ? "Усе" : getGenreLabelBe(genre)}
                </button>
              ))}
            </motion.div>

            {/* Artists grid */}
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((artist, i) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    index={i}
                    onClick={setSelected}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-muted-foreground"
              >
                <Music className="h-10 w-10 mx-auto mb-3 opacity-20" strokeWidth={1} />
                <p className="text-sm">Артысты не знойдзены</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Artist modal */}
      <AnimatePresence>
        {selected && (
          <ArtistModal artist={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
