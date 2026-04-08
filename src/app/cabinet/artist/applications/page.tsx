"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Disc3, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";
import {
  RELEASE_KIND_LABELS,
  RELEASE_STATUS_LABELS,
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

export default function ArtistApplicationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [items, setItems] = useState<ReleaseSubmissionRow[]>([]);

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
    if (!profile?.is_artist || !profile.artist_id) {
      setAllowed(false);
      setLoading(false);
      return;
    }
    setAllowed(true);
    const { data, error: qErr } = await supabase
      .schema("speu")
      .from("release_submissions")
      .select(
        "id, artist_id, user_id, release_kind, status, title, cover_url, cover_storage_path, artist_note, moderator_message, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (qErr) {
      setError(qErr.message);
      setItems([]);
    } else {
      setItems((data ?? []) as ReleaseSubmissionRow[]);
    }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

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
    if (!profile?.artist_id) {
      setError("Профіль артыста не прывязаны.");
      setCreating(false);
      return;
    }
    const { data: sub, error: insErr } = await supabase
      .schema("speu")
      .from("release_submissions")
      .insert({
        artist_id: profile.artist_id,
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
    router.push(`/cabinet/artist/${sub.id}`);
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
          Кабінет артыста даступны пасля прывязкі вашага акаўнта да карточкі артыста на лэйбле.
        </p>
        <Link href="/cabinet" className="inline-block mt-4 text-sm text-primary hover:underline">
          Вярнуцца ў кабінет
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
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
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
        <ul className="space-y-3">
          {items.map((row) => (
            <li key={row.id}>
              <Link
                href={`/cabinet/artist/${row.id}`}
                className="group flex items-center gap-4 glass rounded-2xl border border-border p-5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all"
              >
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
                    "shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border",
                    statusPillClass(row.status),
                  )}
                >
                  {RELEASE_STATUS_LABELS[row.status]}
                </span>
                <span className="text-muted-foreground/40 group-hover:text-emerald-500/50 text-lg">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
