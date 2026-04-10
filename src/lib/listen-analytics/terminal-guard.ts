/**
 * Client-side reasons POST /api/public/listen is never called.
 * Server still applies record_listen_terminal (e.g. track_not_eligible, duration_mismatch).
 */

export type ListenTerminalClientSkipReason =
  | "no_listening_session"
  | "no_track_id"
  | "duration_under_1s";

export function listenTerminalClientSkipReason(params: {
  listeningSessionId: string | null;
  trackId: string | null | undefined;
  durationMs: number;
}): ListenTerminalClientSkipReason | null {
  if (!params.listeningSessionId) return "no_listening_session";
  if (!params.trackId) return "no_track_id";
  if (params.durationMs < 1000) return "duration_under_1s";
  return null;
}
