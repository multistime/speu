/**
 * iOS Safari / PWA: пасля lock screen play() можа «прайграваць» без гуку.
 * Перазагрузка src + аднаўленне currentTime аднаўляе audio session.
 */

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

/**
 * Аднаўляе прайграванне пасля OS / lock screen. На не-iOS — звычайны play().
 */
export async function resumeSpeuAudioFromOs(audio: HTMLAudioElement): Promise<void> {
  const src = (audio.currentSrc || audio.src || "").trim();
  if (!src) return;

  audio.volume = 1;
  audio.muted = false;

  if (!isIosLike()) {
    await audio.play();
    return;
  }

  const savedTime = audio.currentTime;

  if (!audio.paused && savedTime > 0) {
    try {
      await audio.play();
      return;
    } catch {
      /* fall through to reload */
    }
  }

  try {
    audio.pause();
    audio.load();
    await waitForCanPlay(audio, 2500);
    if (savedTime > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(savedTime, audio.duration - 0.05);
    } else if (savedTime > 0) {
      audio.currentTime = savedTime;
    }
    await audio.play();
  } catch {
    try {
      await audio.play();
    } catch {
      /* caller handles UI state */
    }
  }
}
