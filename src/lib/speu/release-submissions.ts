export type ReleaseSubmissionStatus =
  | "draft"
  | "submitted"
  | "needs_changes"
  | "approved"
  | "rejected";

export type ReleaseKind = "single" | "album";

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
  /** Set after moderator approval — catalog `artist_tracks.id` (unpublished draft). */
  artist_track_id: string | null;
  created_at: string;
  updated_at: string;
};

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
};

export type ReleaseSubmissionSubmitCheckInput = {
  release_kind: ReleaseKind;
  title: string;
  cover_url: string | null;
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
  }
  return null;
}
