/**
 * Reads track length in seconds from a local file (object URL + audio metadata).
 * Returns null if the browser cannot decode duration.
 */
export function probeLocalAudioDurationSec(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    const finish = (sec: number | null) => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
      resolve(sec);
    };

    const onError = () => finish(null);

    const onLoaded = () => {
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0) finish(null);
      else finish(Math.round(d));
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
    audio.preload = "metadata";
    audio.src = url;
  });
}
