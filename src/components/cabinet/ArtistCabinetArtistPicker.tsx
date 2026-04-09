"use client";

import Link from "next/link";
import { Disc3 } from "lucide-react";

export type PickerArtist = { id: string; name: string; slug: string };

export function ArtistCabinetArtistPicker({ artists }: { artists: PickerArtist[] }) {
  return (
    <div className="glass rounded-2xl border border-border p-6 sm:p-8 space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <Disc3 className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground italic">
            Выберыце артыста
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            У вас некалькі прывязаных картачак. Абярыце, у кабінет якога артыста ўвайсці.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {artists.map((a) => (
          <li key={a.id}>
            <Link
              href={`/cabinet/artist/${a.id}/analytics`}
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card/20 hover:border-emerald-500/35 hover:bg-emerald-500/[0.04] transition-all"
            >
              <Disc3 className="h-5 w-5 text-emerald-500/80 shrink-0" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {a.name?.trim() || "Без назвы"}
                </p>
                {a.slug ? (
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">/{a.slug}</p>
                ) : null}
              </div>
              <span className="text-muted-foreground/50 group-hover:text-emerald-500/60 text-lg shrink-0">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
