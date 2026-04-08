import Link from "next/link";
import { Music } from "lucide-react";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { fetchSpeuUserLikedTracks } from "@/lib/speu/catalog.server";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import { createClient } from "@/lib/supabase/server";

export default async function SpeuLikedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const liked = user ? await fetchSpeuUserLikedTracks(null) : [];
  const likedPlaylist = liked.map(speuPublicTrackToPlayerTrack);

  return (
    <div className="min-h-screen pt-20 pb-24 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-3 font-medium text-center">
          Спеў
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-2 text-center italic">
          Любімае
        </h1>
        {!user ? (
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-md mx-auto">
            Увайдзіце ў акаўнт, каб бачыць залайканыя трэкі.{" "}
            <Link href="/cabinet" className="text-primary font-medium underline-offset-4 hover:underline">
              Кабінет
            </Link>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center mb-8 max-w-lg mx-auto">
            Трэкі, якія вы адзначылі сэрцам.
          </p>
        )}
        {!user ? null : liked.length === 0 ? (
          <div className="glass rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Music className="h-10 w-10 mx-auto mb-3 opacity-25" strokeWidth={1} />
            <p className="text-sm">Пакуль няма залайканых трэкаў.</p>
          </div>
        ) : (
          <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-1.5 sm:p-3">
            {liked.map((t, i) => (
              <SpeuTrackRow key={t.id} track={t} index={i} showCover playlist={likedPlaylist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
