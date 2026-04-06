import type { SpeuArtistTheme } from "@/lib/speu/theme";

export type SpeuCreditArtist = {
  id: string;
  slug: string;
  name: string;
};

export type SpeuPublicTrack = {
  id: string;
  slug: string;
  title: string;
  audioUrl: string;
  coverUrl: string | null;
  durationSec: number | null;
  artistLine: string;
  artists: SpeuCreditArtist[];
  album: { id: string; slug: string; title: string } | null;
  accentColor: string;
  accentRgb: string;
  playOnRadio: boolean;
  sortOrder: number;
  createdAt: string;
};

export type SpeuHubArtistCard = {
  slug: string;
  name: string;
  nameEn: string;
  genres: string[];
  tagline: string;
  location: string;
  year: string;
  initial: string;
  theme: SpeuArtistTheme;
};

export type SpeuArtistAlbum = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  releaseDate: string | null;
};

export type SpeuArtistPageData = {
  slug: string;
  name: string;
  nameEn: string;
  genres: string[];
  tagline: string;
  bio: string;
  location: string;
  year: string;
  socials: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    telegram?: string;
  };
  theme: SpeuArtistTheme;
  albums: SpeuArtistAlbum[];
  tracks: SpeuPublicTrack[];
};

export type SpeuAlbumPageData = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  releaseDate: string | null;
  description: string | null;
  artist: { slug: string; name: string; theme: SpeuArtistTheme };
  tracks: SpeuPublicTrack[];
};

export type SpeuTrackPageData = {
  track: SpeuPublicTrack;
  sameAlbum: SpeuPublicTrack[];
};
