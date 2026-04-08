"use client";

export type ListenTerminalPayload = {
  listeningSessionId: string;
  trackId: string;
  durationMs: number;
  maxPositionMs: number;
  hadUserSeek: boolean;
  hadUserPause: boolean;
  shortGapCount: number;
};

export function submitListenTerminal(payload: ListenTerminalPayload, useBeacon = false): void {
  const body = JSON.stringify(payload);
  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    void navigator.sendBeacon("/api/public/listen", blob);
    return;
  }
  void fetch("/api/public/listen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body,
  }).catch(() => {});
}
