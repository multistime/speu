import { Music } from "lucide-react";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { fetchSpeuChartRows } from "@/lib/speu/catalog.server";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";

/** Чарт і каталог з БД — не кэшаваць старонку як статычную */
export const dynamic = "force-dynamic";

export default async function SpeuTop100Page() {
  const { rows } = await fetchSpeuChartRows(100);
  const topPlaylist = rows.map((r) => speuPublicTrackToPlayerTrack(r.track));

  return (
    <div className="min-h-screen pb-24 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-3 font-medium text-center">
          Рэйтынг
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-2 text-center italic">
          Топ трэкаў
        </h1>
        <p className="text-xs text-muted-foreground text-center mb-8 max-w-lg mx-auto">
          Афіцыйны чарт па апублікаваным snapshot (да 100 пазіцый). Абнаўленне штодзён у 03:00 па Мінску.
        </p>
        {rows.length === 0 ? (
          <div className="glass rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Music className="h-10 w-10 mx-auto mb-3 opacity-25" strokeWidth={1} />
            <p className="text-sm">Пакуль няма трэкаў у каталозе.</p>
          </div>
        ) : (
          <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-1.5 sm:p-3">
            {rows.map((r, i) => (
              <SpeuTrackRow
                key={r.track.id}
                track={r.track}
                index={i}
                rank={r.rank}
                chartMovement={r.movement}
                chartDelta={r.delta}
                showCover
                playlist={topPlaylist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
