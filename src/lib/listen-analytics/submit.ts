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

const debugListen =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SPEU_DEBUG_LISTEN === "1";

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
  })
    .then(async (res) => {
      if (!debugListen || res.ok) return;
      let detail: unknown;
      try {
        detail = await res.json();
      } catch {
        detail = null;
      }
      console.warn("[speu:listen] submit rejected", res.status, detail);
    })
    .catch(() => {});
}
