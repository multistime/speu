import { Music } from "lucide-react";
import { SpeuBackButton } from "@/components/speu/SpeuBackButton";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { fetchSpeuPlayableTracks } from "@/lib/speu/catalog.server";

export default async function SpeuTop100Page() {
  const playable = await fetchSpeuPlayableTracks();
  const list = playable.slice(0, 100);

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-3 font-medium text-center">
          Рэйтынг
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-2 text-center italic">
          Топ трэкаў
        </h1>
        <p className="text-xs text-muted-foreground text-center mb-2 max-w-lg mx-auto">
          Той жа парадак, што ў блоцы «У топе» на галоўнай старонцы хаба (да 100 пазіцый).
        </p>
        <p className="mb-10">
          <SpeuBackButton />
        </p>

        {list.length === 0 ? (
          <div className="glass rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Music className="h-10 w-10 mx-auto mb-3 opacity-25" strokeWidth={1} />
            <p className="text-sm">Пакуль няма трэкаў у каталозе.</p>
          </div>
        ) : (
          <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-2 sm:p-3">
            {list.map((t, i) => (
              <SpeuTrackRow key={t.id} track={t} index={i} showCover />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
