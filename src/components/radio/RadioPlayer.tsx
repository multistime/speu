"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Radio, SkipForward } from "lucide-react";

type RadioTrack = {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl: string | null;
  durationSec: number | null;
  artistName: string | null;
};

type RadioPayload = {
  enabled: boolean;
  mode: "playlist" | "stream" | "off";
  name: string;
  description: string;
  streamUrl: string | null;
  fallbackStreamUrl: string | null;
  tracks: RadioTrack[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function RadioPlayer() {
  const [data, setData] = useState<RadioPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [streamSrc, setStreamSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/radio")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setLoadError(json.details ?? json.error);
          setData(null);
        } else {
          setData(json as RadioPayload);
          setStreamSrc(json.streamUrl ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Не ўдалося загрузіць даныя радыё");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shuffledTracks = useMemo(() => {
    if (!data?.tracks?.length) return [];
    return shuffle(data.tracks);
  }, [data?.tracks]);

  useEffect(() => {
    setPlaylistIndex(0);
  }, [shuffledTracks]);

  const currentTrack =
    data?.mode === "playlist" && shuffledTracks.length > 0
      ? shuffledTracks[playlistIndex % shuffledTracks.length]
      : null;

  const goNext = useCallback(() => {
    if (shuffledTracks.length <= 1) return;
    setPlaylistIndex((i) => (i + 1) % shuffledTracks.length);
  }, [shuffledTracks.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загрузка радыё…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  if (!data) return null;

  if (!data.enabled) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        Радыё часова адключана ў наладах адміністратара.
      </div>
    );
  }

  if (data.mode === "off") {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 text-sm text-muted-foreground">
        <p>
          Пакуль няма крыніцы гуку. Зрабіце адно з наступнага:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs leading-relaxed">
          <li>
            У <span className="font-mono text-primary/90">Адмінка → Песні</span> загрузіце MP3,
            уключыце <strong>«На радыё»</strong> і апублікуйце трэк і артыста.
          </li>
          <li>
            Альбо ў <span className="font-mono text-primary/90">Адмінка → Радыё</span> укажыце URL стрыму
            (Icecast / HLS) у полі асноўнага URL.
          </li>
          <li>
            Альбо дадайце зменную асяроддзя{" "}
            <span className="font-mono">NEXT_PUBLIC_RADYO_MARA_STREAM_URL</span> у Vercel.
          </li>
        </ul>
      </div>
    );
  }

  if (data.mode === "playlist" && currentTrack) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {currentTrack.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentTrack.coverUrl}
              alt=""
              className="w-full sm:w-32 h-32 rounded-xl object-cover border border-border shrink-0 mx-auto sm:mx-0"
            />
          ) : (
            <div className="w-full sm:w-32 h-32 rounded-xl border border-border bg-muted flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Radio className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Зараз гучыць
            </p>
            <p className="text-lg font-semibold text-foreground truncate">{currentTrack.title}</p>
            {currentTrack.artistName && (
              <p className="text-sm text-muted-foreground truncate">{currentTrack.artistName}</p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-2">
              Плэйліст у выпадковым парадку · {shuffledTracks.length}{" "}
              {shuffledTracks.length === 1 ? "трэк" : "трэкаў"}
            </p>
          </div>
        </div>

        <audio
          key={currentTrack.id}
          controls
          className="w-full"
          src={currentTrack.audioUrl}
          onEnded={goNext}
        >
          Ваш браўзер не падтрымлівае прайграванне аўдыя.
        </audio>

        {shuffledTracks.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg border border-border bg-muted/50 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <SkipForward className="h-4 w-4" />
            Наступны трэк
          </button>
        )}
      </div>
    );
  }

  /* stream mode */
  const activeStream = streamSrc || data.streamUrl;
  if (!activeStream) {
    return (
      <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
        URL стрыму не наладжаны.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <audio
        controls
        className="w-full"
        src={activeStream}
        onError={() => {
          if (data.fallbackStreamUrl && streamSrc !== data.fallbackStreamUrl) {
            setStreamSrc(data.fallbackStreamUrl);
          }
        }}
      >
        Ваш браўзер не падтрымлівае прайграванне аўдыя.
      </audio>
      {data.fallbackStreamUrl && streamSrc === data.fallbackStreamUrl && (
        <p className="text-xs text-amber-600/90">Выкарыстоўваецца рэзервовы стрым.</p>
      )}
    </div>
  );
}
