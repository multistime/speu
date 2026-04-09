import {
  MAX_GENRES_PER_TRACK,
  validateGenresForSubmit,
  normalizeGenreCodeList,
  isAllowedGenreCode,
} from "@/lib/speu/genre-taxonomy";

export type ReleaseSubmissionStatus =
  | "draft"
  | "submitted"
  | "needs_changes"
  | "approved"
  | "rejected";

export type ReleaseKind = "single" | "album";

/** Выкарыстоўваецца ў `artist_tracks.language` і заявцы. */
export type TrackVocalLanguage = "bel" | "ru" | "en" | "instrumental";

export type WorkKind = "track" | "beat" | "podcast" | "audiobook";

export const RELEASE_SUBMISSION_TERMS_VERSION = "1";

export const WORK_KIND_LABELS: Record<WorkKind, string> = {
  track: "Трэк (песня)",
  beat: "Біт",
  podcast: "Падкаст",
  audiobook: "Аўдыякніга",
};

export const TRACK_VOCAL_LANGUAGE_LABELS: Record<TrackVocalLanguage, string> = {
  bel: "Беларуская",
  ru: "Руская",
  en: "Англійская",
  instrumental: "Інструментал (без вакалу)",
};

const WORK_KIND_SET = new Set<WorkKind>(["track", "beat", "podcast", "audiobook"]);

export function parseWorkKind(raw: string | null | undefined): WorkKind | null {
  if (!raw) return null;
  return WORK_KIND_SET.has(raw as WorkKind) ? (raw as WorkKind) : null;
}

export type ReleaseSubmissionRow = {
  id: string;
  artist_id: string;
  user_id: string;
  release_kind: ReleaseKind;
  status: ReleaseSubmissionStatus;
  title: string;
  cover_url: string | null;
  cover_storage_path: string | null;
  artist_note: string | null;
  moderator_message: string | null;
  /** Set when the artist confirms distribution terms (persisted from cabinet). */
  accepted_terms: boolean;
  /** Set when the artist confirms they hold rights to the content. */
  confirmed_rights: boolean;
  /** Filled when the submission is sent for review (audit). */
  rights_attested_at: string | null;
  terms_version: string | null;
  /** Set by label to hide from active moderation queue */
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReleaseSubmissionTrackRow = {
  id: string;
  submission_id: string;
  sort_order: number;
  title: string;
  audio_url: string | null;
  audio_storage_path: string | null;
  cover_url: string | null;
  cover_storage_path: string | null;
  /** Даўжыня аўдыё ў с, з файла пры загрузцы ў кабінеце */
  duration_sec: number | null;
  notes: string | null;
  lyrics: string | null;
  /** Canonical genre codes from `genre-taxonomy` */
  genres: string[];
  work_kind: WorkKind;
  is_explicit: boolean;
  is_ai_lyrics: boolean;
  is_ai_music: boolean;
  language: TrackVocalLanguage;
  /** Поўнае імя аўтара музыкі (абавязкова перад адпраўкай). */
  music_author: string | null;
  /** Аўтар слоў — толькі калі не інструментал; абавязкова перад адпраўкай. */
  lyrics_author: string | null;
  /** Set after moderator approval — catalog `artist_tracks.id` (unpublished draft). */
  artist_track_id: string | null;
  created_at: string;
  updated_at: string;
};

export function normalizeReleaseSubmissionRow(raw: Record<string, unknown>): ReleaseSubmissionRow {
  const base = raw as Partial<ReleaseSubmissionRow>;
  return {
    id: String(base.id),
    artist_id: String(base.artist_id),
    user_id: String(base.user_id),
    release_kind: base.release_kind === "album" ? "album" : "single",
    status: (base.status ?? "draft") as ReleaseSubmissionStatus,
    title: typeof base.title === "string" ? base.title : "",
    cover_url: base.cover_url ?? null,
    cover_storage_path: base.cover_storage_path ?? null,
    artist_note: base.artist_note ?? null,
    moderator_message: base.moderator_message ?? null,
    accepted_terms: Boolean(base.accepted_terms),
    confirmed_rights: Boolean(base.confirmed_rights),
    rights_attested_at: base.rights_attested_at ?? null,
    terms_version: base.terms_version ?? null,
    archived_at: base.archived_at ?? null,
    created_at: typeof base.created_at === "string" ? base.created_at : "",
    updated_at: typeof base.updated_at === "string" ? base.updated_at : "",
  };
}

/** Map DB row (possibly partial before client reload) to a full track row. */
export function normalizeReleaseSubmissionTrackRow(
  raw: Record<string, unknown>
): ReleaseSubmissionTrackRow {
  const wk = parseWorkKind(typeof raw.work_kind === "string" ? raw.work_kind : null) ?? "track";
  const langRaw = typeof raw.language === "string" ? raw.language : "bel";
  const lang: TrackVocalLanguage =
    langRaw === "bel" || langRaw === "ru" || langRaw === "en" || langRaw === "instrumental"
      ? langRaw
      : "bel";
  const genresRaw = raw.genres;
  const genres = Array.isArray(genresRaw)
    ? normalizeGenreCodeList(genresRaw.filter((x): x is string => typeof x === "string"))
    : [];
  return {
    id: String(raw.id),
    submission_id: String(raw.submission_id),
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : Number(raw.sort_order) || 0,
    title: typeof raw.title === "string" ? raw.title : "",
    audio_url: typeof raw.audio_url === "string" ? raw.audio_url : null,
    audio_storage_path: typeof raw.audio_storage_path === "string" ? raw.audio_storage_path : null,
    cover_url: typeof raw.cover_url === "string" ? raw.cover_url : null,
    cover_storage_path:
      typeof raw.cover_storage_path === "string" ? raw.cover_storage_path : null,
    duration_sec:
      typeof raw.duration_sec === "number" && Number.isFinite(raw.duration_sec)
        ? raw.duration_sec
        : null,
    notes: typeof raw.notes === "string" ? raw.notes : null,
    lyrics: typeof raw.lyrics === "string" ? raw.lyrics : null,
    genres,
    work_kind: wk,
    is_explicit: Boolean(raw.is_explicit),
    is_ai_lyrics: Boolean(raw.is_ai_lyrics),
    is_ai_music: Boolean(raw.is_ai_music),
    language: lang,
    music_author: typeof raw.music_author === "string" ? raw.music_author : null,
    lyrics_author: typeof raw.lyrics_author === "string" ? raw.lyrics_author : null,
    artist_track_id: typeof raw.artist_track_id === "string" ? raw.artist_track_id : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
  };
}

export const RELEASE_STATUS_LABELS: Record<ReleaseSubmissionStatus, string> = {
  draft: "Чарнік",
  submitted: "На мадэрацыі",
  needs_changes: "Патрэбныя праўкі",
  approved: "Ухвалена",
  rejected: "Адхілена",
};

export const RELEASE_KIND_LABELS: Record<ReleaseKind, string> = {
  single: "Сінгл",
  album: "Альбом",
};

export function submissionIsEditable(status: ReleaseSubmissionStatus): boolean {
  return status === "draft" || status === "needs_changes";
}

/** Matches RLS `release_submissions_delete_artist` (not on moderation / not approved). */
export function submissionArtistCanDelete(status: ReleaseSubmissionStatus): boolean {
  return status === "draft" || status === "needs_changes" || status === "rejected";
}

export type ReleaseSubmissionSubmitCheckTrack = {
  title: string;
  audio_url: string | null;
  cover_url: string | null;
  genres: string[];
  work_kind: WorkKind;
  is_explicit: boolean;
  is_ai_lyrics: boolean;
  is_ai_music: boolean;
  language: TrackVocalLanguage;
  music_author: string | null;
  lyrics_author: string | null;
};

export type ReleaseSubmissionSubmitCheckInput = {
  release_kind: ReleaseKind;
  title: string;
  cover_url: string | null;
  accepted_terms: boolean;
  confirmed_rights: boolean;
  tracks: ReleaseSubmissionSubmitCheckTrack[];
};

/** Returns Belarusian error message or null if submission is allowed. */
export function getReleaseSubmissionSubmitError(input: ReleaseSubmissionSubmitCheckInput): string | null {
  if (!input.title.trim()) {
    return "Укажыце назву рэлізу.";
  }
  if (input.release_kind === "album" && !input.cover_url?.trim()) {
    return "Загрузіце вокладку рэлізу.";
  }
  if (!input.accepted_terms) {
    return "Пацвердзіце згоду з правіламі падачы матэрыялаў.";
  }
  if (!input.confirmed_rights) {
    return "Пацвердзіце, што валодаеце правамі на гэты кантэнт.";
  }
  if (input.tracks.length === 0) {
    return "Дадайце хаця б адзін трэк.";
  }
  for (let i = 0; i < input.tracks.length; i++) {
    const t = input.tracks[i];
    if (!t.title.trim()) {
      return `Трэк ${i + 1}: укажыце назву.`;
    }
    if (!t.audio_url?.trim()) {
      return `Трэк ${i + 1}: загрузіце аўдыё.`;
    }
    if (input.release_kind === "single" && !t.cover_url?.trim()) {
      return `Трэк ${i + 1}: загрузіце вокладку.`;
    }
    if (!parseWorkKind(t.work_kind)) {
      return `Трэк ${i + 1}: абярыце тып запісу.`;
    }
    const genreErr = validateGenresForSubmit(t.genres);
    if (genreErr) {
      return `Трэк ${i + 1}: ${genreErr}`;
    }
    for (const g of normalizeGenreCodeList(t.genres, MAX_GENRES_PER_TRACK)) {
      if (!isAllowedGenreCode(g)) {
        return `Трэк ${i + 1}: невядомы жанр «${g}». Абярыце зі спісу.`;
      }
    }
    if (
      t.language !== "bel" &&
      t.language !== "ru" &&
      t.language !== "en" &&
      t.language !== "instrumental"
    ) {
      return `Трэк ${i + 1}: абярыце мову вакалу або інструментал.`;
    }
    if (!t.music_author?.trim()) {
      return `Трэк ${i + 1}: укажыце аўтара музыкі.`;
    }
    if (t.language !== "instrumental") {
      if (!t.lyrics_author?.trim()) {
        return `Трэк ${i + 1}: укажыце аўтара слоў (або пазначце інструментал).`;
      }
    }
  }
  return null;
}
