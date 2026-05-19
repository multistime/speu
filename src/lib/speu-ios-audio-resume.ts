/**
 * iOS Safari / PWA + AirPods: пасля lock screen play() можа «прайграваць» без гуку.
 * Спачатку хуткі play(); поўны load() — толькі калі хуткі шлях не дапамог.
 */

export type SpeuAudioResumeReason = "os" | "ui" | "visibility";

export type SpeuAudioResumeOptions = {
  reason?: SpeuAudioResumeReason;
  /** Прымусова перазагрузіць src (напрыклад, пасля unlock экрана) */
  forceReload?: boolean;
};

function isIosLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const platform = navigator.platform ?? "";
  if (/iPhone|iPod|iPad/i.test(ua)) return true;
  if (/^iPhone|^iPad|^iPod/i.test(platform)) return true;
  if (/Mac/i.test(platform) && navigator.maxTouchPoints > 1) return true;
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

function absoluteSrc(audio: HTMLAudioElement): string {
  return (audio.currentSrc || audio.src || "").trim();
}

function prepareOutput(audio: HTMLAudioElement): void {
  audio.volume = 1;
  audio.muted = false;
}

/** Web Audio session unlock — дапамагае Bluetooth / AirPods на iOS PWA. */
export async function unlockSpeuAudioSession(): Promise<void> {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  type CtxHolder = { ctx?: AudioContext };
  const g = globalThis as unknown as CtxHolder & { __speuUnlockCtx?: AudioContext };
  if (!g.__speuUnlockCtx) {
    try {
      g.__speuUnlockCtx = new AC();
    } catch {
      return;
    }
  }
  const ctx = g.__speuUnlockCtx;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
}

function waitForCanPlay(audio: HTMLAudioElement, timeoutMs: number): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("audio_load_failed"));
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timer);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("loadeddata", onReady);
      audio.removeEventListener("error", onErr);
    };
    audio.addEventListener("canplay", onReady, { once: true });
    audio.addEventListener("loadeddata", onReady, { once: true });
    audio.addEventListener("error", onErr, { once: true });
  });
}

function restoreTime(audio: HTMLAudioElement, savedTime: number): void {
  if (savedTime <= 0) return;
  const d = audio.duration;
  if (Number.isFinite(d) && d > 0) {
    audio.currentTime = Math.min(savedTime, Math.max(0, d - 0.05));
  } else {
    audio.currentTime = savedTime;
  }
}

/** Хуткі play без load — для AirPods / lock screen пасля звычайнай паўзы. */
async function tryFastPlay(audio: HTMLAudioElement): Promise<boolean> {
  if (!audio.paused) return true;
  if (audio.readyState < HTMLMediaElement.HAVE_METADATA) return false;
  try {
    await audio.play();
    return !audio.paused;
  } catch {
    return false;
  }
}

/** Мяккае аднаўленне: перапрызначыць src без поўнага load(). */
async function trySoftSrcRefresh(audio: HTMLAudioElement, savedTime: number): Promise<boolean> {
  const src = absoluteSrc(audio);
  if (!src) return false;
  try {
    audio.pause();
    audio.src = "";
    audio.src = src;
    await waitForCanPlay(audio, 500);
    restoreTime(audio, savedTime);
    await audio.play();
    return !audio.paused;
  } catch {
    return false;
  }
}

/** Поўная перазагрузка — толькі калі хуткія шляхі не дапамаглі. */
async function tryHardReload(audio: HTMLAudioElement, savedTime: number): Promise<boolean> {
  const src = absoluteSrc(audio);
  if (!src) return false;
  try {
    audio.pause();
    audio.load();
    await waitForCanPlay(audio, 1200);
    restoreTime(audio, savedTime);
    await audio.play();
    return !audio.paused;
  } catch {
    return false;
  }
}

/**
 * Праверка «ці сапраўды грае» — currentTime рухаецца.
 * Карысна для silent playback пасля OS play.
 */
export function isSpeuAudioProgressing(
  audio: HTMLAudioElement,
  baselineTime: number,
  minDeltaSec = 0.04,
): boolean {
  if (audio.paused) return false;
  return audio.currentTime > baselineTime + minDeltaSec;
}

/**
 * Аднаўляе прайграванне пасля OS / lock screen / AirPods.
 */
export async function resumeSpeuAudioFromOs(
  audio: HTMLAudioElement,
  options: SpeuAudioResumeOptions = {},
): Promise<void> {
  const src = absoluteSrc(audio);
  if (!src) return;

  const reason = options.reason ?? "ui";
  const savedTime = audio.currentTime;

  prepareOutput(audio);

  if (!isIosLike()) {
    await audio.play();
    return;
  }

  await unlockSpeuAudioSession();

  if (options.forceReload) {
    const ok = await tryHardReload(audio, savedTime);
    if (!ok) await tryFastPlay(audio);
    return;
  }

  // AirPods / lock screen: звычайная паўза — дастаткова play() (<50 ms).
  if (reason === "os" || reason === "ui") {
    if (await tryFastPlay(audio)) return;
  }

  // «Грае» без гуку — спачатку мякка, потым load.
  if (!audio.paused) {
    if (await trySoftSrcRefresh(audio, savedTime)) return;
    if (await tryHardReload(audio, savedTime)) return;
    return;
  }

  if (await trySoftSrcRefresh(audio, savedTime)) return;
  if (await tryHardReload(audio, savedTime)) return;

  await tryFastPlay(audio);
}

/**
 * Калі play() прайшоў, але гуку няма — кароткая праверка і мяккае аднаўленне.
 */
export async function repairSpeuSilentPlayback(
  audio: HTMLAudioElement,
  baselineTime: number,
): Promise<void> {
  if (audio.paused) return;
  await new Promise((r) => window.setTimeout(r, 350));
  if (audio.paused) return;
  if (isSpeuAudioProgressing(audio, baselineTime)) return;
  const t = audio.currentTime;
  if (await trySoftSrcRefresh(audio, t)) return;
  await tryHardReload(audio, t);
}
