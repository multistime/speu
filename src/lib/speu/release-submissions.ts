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
