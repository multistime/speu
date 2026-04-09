"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Disc3, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile, type SpeuProfile } from "@/lib/supabase/speu";
import {
  RELEASE_KIND_LABELS,
  RELEASE_STATUS_LABELS,
  normalizeReleaseSubmissionRow,
  type ReleaseSubmissionRow,
} from "@/lib/speu/release-submissions";
import { cn } from "@/lib/utils";

function statusPillClass(status: ReleaseSubmissionRow["status"]): string {
  switch (status) {
    case "draft":
      return "bg-muted text-muted-foreground border-border";
    case "submitted":
      return "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25";
    case "needs_changes":
      return "bg-orange-500/12 text-orange-600 dark:text-orange-400 border-orange-500/25";
    case "approved":
      return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/25";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

const SECTIONS: {
  id: string;
  title: string;
  statuses: ReleaseSubmissionRow["status"][];
}[] = [
  { id: "draft", title: "Чарнікі", statuses: ["draft"] },
  { id: "submitted", title: "На мадэрацыі", statuses: ["submitted"] },
  { id: "needs_changes", title: "Патрэбныя праўкі", statuses: ["needs_changes"] },
  { id: "done", title: "Завершаныя", statuses: ["approved", "rejected"] },
];

function normalizeRow(raw: Record<string, unknown>): ReleaseSubmissionRow {
  return normalizeReleaseSubmissionRow(raw);
}

type SubmissionTrackCover = { cover_url: string | null; sort_order: number };

function listThumbnailUrl(
  row: ReleaseSubmissionRow,
  trackCovers: SubmissionTrackCover[] | undefined,
): string | null {
  if (row.cover_url?.trim()) return row.cover_url.trim();
  if (row.release_kind !== "single" || !trackCovers?.length) return null;
  const sorted = [...trackCovers].sort((a, b) => a.sort_order - b.sort_order);
  for (const t of sorted) {
    if (t.cover_url?.trim()) return t.cover_url.trim();
  }
  return null;
}

function toListItem(raw: Record<string, unknown>): ReleaseSubmissionRow & { listThumbnailUrl: string | null } {
  const tracks = (raw.release_submission_tracks as SubmissionTrackCover[] | null | undefined) ?? undefined;
  const rest = { ...raw };
  delete rest.release_submission_tracks;
  const row = normalizeRow(rest);
  return {
    ...row,
    listThumbnailUrl: listThumbnailUrl(row, tracks),
  };
}

type ApplicationListRow = ReleaseSubmissionRow & { listThumbnailUrl: string | null };

function SubmissionListRow({ row, artistId }: { row: ApplicationListRow; artistId: string }) {
  const thumb = row.listThumbnailUrl;
  return (
    <li>
      <Link
        href={`/cabinet/artist/${artistId}/submission/${row.id}`}
        className="group flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 glass rounded-2xl border border-border p-4 sm:p-5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all min-w-0 focus-within:ring-2 focus-within:ring-primary/25 focus-within:ring-offset-2 focus-within:ring-offset-background"
      >
        <div className="shrink-0 min-w-[4.5rem] w-[4.5rem] h-[4.5rem] rounded-xl border border-border bg-muted/40 overflow-hidden flex items-center justify-center aspect-square">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="w-full h-full object-cover" />
          ) : (
            <Disc3 className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.25} />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {row.title?.trim() || "Без назвы"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {RELEASE_KIND_LABELS[row.release_kind]} ·{" "}
              {new Date(row.updated_at).toLocaleString("be-BY", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 self-start sm:self-center text-xs font-medium px-2.5 py-1 rounded-full border",
              statusPillClass(row.status),
            )}
          >
            {RELEASE_STATUS_LABELS[row.status]}
          </span>
        </div>
        <span className="text-muted-foreground/40 group-hover:text-emerald-500/50 text-lg shrink-0 hidden sm:inline sm:ml-auto">
          →
        </span>
      </Link>
    </li>
  );
}

function profileOwnsArtist(profile: SpeuProfile | null, artistId: string): boolean {
  if (!profile?.is_artist) return false;
  const linked = profile.linked_artists;
  if (Array.isArray(linked) && linked.length > 0) {
    return linked.some((a) => a && typeof a === "object" && "id" in a && (a as { id: string }).id === artistId);
  }
  return profile.artist_id === artistId;
}

export default function ArtistApplicationsPageClient({ artistId }: { artistId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [items, setItems] = useState<ApplicationListRow[]>([]);

  const load = useCallback(async () => {
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/cabinet");
      return;
    }
    const profile = await getSpeuProfile(supabase, user.id);
    if (!profileOwnsArtist(profile, artistId)) {
      setAllowed(false);
      setLoading(false);
      return;
    }
    setAllowed(true);
    const { data, error: qErr } = await supabase
      .schema("speu")
      .from("release_submissions")
      .select(
        "id, artist_id, user_id, release_kind, status, title, cover_url, cover_storage_path, artist_note, moderator_message, archived_at, created_at, updated_at, release_submission_tracks ( cover_url, sort_order )",
      )
      .eq("user_id", user.id)
      .eq("artist_id", artistId)
      .order("updated_at", { ascending: false });
    if (qErr) {
      setError(qErr.message);
      setItems([]);
    } else {
      setItems((data ?? []).map((r) => toListItem(r as Record<string, unknown>)));
    }
    setLoading(false);
  }, [artistId, router, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const sectionsWithItems = useMemo(() => {
    return SECTIONS.map((sec) => ({
      ...sec,
      rows: items.filter((r) => sec.statuses.includes(r.status)),
    })).filter((s) => s.rows.length > 0);
  }, [items]);

  const createDraft = async () => {
    setCreating(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/cabinet");
      return;
    }
    const profile = await getSpeuProfile(supabase, user.id);
    if (!profileOwnsArtist(profile, artistId)) {
      setError("Няма доступу да гэтай картачкі артыста.");
      setCreating(false);
      return;
    }
    const { data: sub, error: insErr } = await supabase
      .schema("speu")
      .from("release_submissions")
      .insert({
        artist_id: artistId,
        user_id: user.id,
        release_kind: "single",
        status: "draft",
        title: "Новы рэліз",
      })
      .select("id")
      .single();
    if (insErr || !sub) {
      setError(insErr?.message ?? "Не ўдалося стварыць заяўку");
      setCreating(false);
      return;
    }
    const { error: trErr } = await supabase.schema("speu").from("release_submission_tracks").insert({
      submission_id: sub.id,
      sort_order: 0,
      title: "",
    });
    if (trErr) {
      setError(trErr.message);
      setCreating(false);
      return;
    }
    setCreating(false);
    router.push(`/cabinet/artist/${artistId}/submission/${sub.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="glass rounded-2xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Няма доступу да кабінета гэтага артыста. Выберыце картачку ў спісе або звярніцеся да лэйбла.
        </p>
        <Link href="/cabinet/artist" className="inline-block mt-4 text-sm text-primary hover:underline">
          Да выбару артыста
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <Disc3 className="h-6 w-6 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground italic">Заяўкі на рэліз</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Стварайце заяўкі, загружайце трэкі і адсочвайце мадэрацыю
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void createDraft()}
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          )}
          Новая заяўка
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-3">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Пакуль няма заявак. Стварыце першую — кнопка вышэй.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sectionsWithItems.map((sec) => (
            <section key={sec.id} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                {sec.title}
              </h2>
              <ul className="space-y-3">
                {sec.rows.map((row) => (
                  <SubmissionListRow key={row.id} row={row} artistId={artistId} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
