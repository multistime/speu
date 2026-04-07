/**
 * Reads duration from a local audio file in the browser (metadata).
 * Returns whole seconds or null if unknown / unsupported.
 */
export function getAudioDurationSecFromFile(file: File): Promise<number | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";

    const done = (sec: number | null) => {
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      audio.load();
      resolve(sec);
    };

    const onMeta = () => {
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0 || d === Number.POSITIVE_INFINITY) {
        done(null);
        return;
      }
      done(Math.min(86400, Math.round(d)));
    };

    audio.addEventListener("loadedmetadata", onMeta, { once: true });
    audio.addEventListener(
      "error",
      () => {
        done(null);
      },
      { once: true }
    );

    audio.src = url;
  });
}
