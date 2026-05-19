/**
 * Адзіны экзэмпляр HTMLAudioElement для глабальнага плэера.
 * Пры перамантаваньні PlayerProvider (навігацыя App Router) нельга зьнішчаць аўдыё ў cleanup —
 * інакш струмень спыняецца. Стан React аднаўляецца з sessionStorage у PlayerContext.
 */
let shared: HTMLAudioElement | null = null;

export function getSpeuPlayerAudio(): HTMLAudioElement {
  if (typeof window === "undefined") {
    throw new Error("getSpeuPlayerAudio is client-only");
  }
  if (!shared) {
    shared = new Audio();
    shared.preload = "auto";
    shared.setAttribute("playsinline", "");
    shared.setAttribute("webkit-playsinline", "");
    shared.volume = 1;
    // Bluetooth / AirPods: трымаць буфер гатовым пасля паўзы
    shared.autoplay = false;
  }
  return shared;
}
