"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatTrackDuration } from "@/components/speu/speu-format-duration";
import {
  RELEASE_KIND_LABELS,
  RELEASE_STATUS_LABELS,
  type ReleaseKind,
  type ReleaseSubmissionStatus,
} from "@/lib/speu/release-submissions";

const releaseStatuses: ReleaseSubmissionStatus[] = [
  "draft",
  "submitted",
  "needs_changes",
  "approved",
  "rejected",
];

type ReleaseSubmissionAdminItem = {
  id: string;
  artist_id: string;
  user_id: string;
  release_kind: ReleaseKind;
  status: ReleaseSubmissionStatus;
  title: string;
  cover_url: string | null;
  cover_storage_path: string | null;
  artist_note: string | null;
  moderator_message: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  artist: { id: string; name: string; slug: string } | null;
  tracks: Array<{
    id: string;
    title: string;
    sort_order: number;
    audio_url: string | null;
    duration_sec: number | null;
    notes: string | null;
    lyrics: string | null;
    artist_track_id: string | null;
    cover_url: string | null;
    cover_storage_path: string | null;
  }>;
};

const releaseStatusSortPriority: Record<ReleaseSubmissionStatus, number> = {
  submitted: 0,
  needs_changes: 1,
  draft: 2,
  approved: 3,
  rejected: 4,
};

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("be-BY", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function TabButton(props: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`min-h-9 px-4 py-2 rounded-lg text-sm font-medium transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        props.active
          ? "bg-primary/15 border-primary/40 text-foreground"
          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      {props.children}
    </button>
  );
}

function firstSortedTrackCoverUrl(item: ReleaseSubmissionAdminItem): string | null {
  const sorted = [...item.tracks].sort((a, b) => a.sort_order - b.sort_order);
  for (const t of sorted) {
    if (t.cover_url?.trim()) return t.cover_url.trim();
  }
  return null;
}

export function LabelReleaseSubmissionsPanel() {
  const [items, setItems] = useState<ReleaseSubmissionAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [queueView, setQueueView] = useState<"active" | "archived">("active");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/release-submissions");
    const data = await res.json();
    const raw = (data.items ?? []) as ReleaseSubmissionAdminItem[];
    const list = raw.map((it) => ({
      ...it,
      archived_at: it.archived_at ?? null,
      tracks: (it.tracks ?? []).map((t) => ({
        ...t,
        cover_url: t.cover_url ?? null,
        cover_storage_path: t.cover_storage_path ?? null,
        lyrics: t.lyrics ?? null,
      })),
    }));
    setItems(list);
    setMessageDrafts((prev) => {
      const next = { ...prev };
      for (const it of list) {
        if (next[it.id] === undefined) next[it.id] = it.moderator_message ?? "";
      }
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const base = items.filter((it) =>
      queueView === "active" ? it.archived_at == null : it.archived_at != null,
    );
    return [...base].sort((a, b) => {
      const pa = releaseStatusSortPriority[a.status];
      const pb = releaseStatusSortPriority[b.status];
      if (pa !== pb) return pa - pb;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [items, queueView]);

  const changeStatus = async (id: string, status: ReleaseSubmissionStatus) => {
    const res = await fetch("/api/admin/release-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        typeof data.details === "string"
          ? data.details
          : data.error === "promote_failed"
            ? "Не ўдалося стварыць песні ў каталозе. Статус заяўкі вярнуты."
            : "Не ўдалося захаваць статус";
      alert(msg);
    }
    await load();
  };

  const saveModeratorMessage = async (id: string) => {
    const text = messageDrafts[id] ?? "";
    setSavingId(id);
    await fetch("/api/admin/release-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, moderator_message: text.trim() === "" ? null : text }),
    });
    setSavingId(null);
    await load();
  };

  const setArchived = async (id: string, archive: boolean) => {
    setArchivingId(id);
    const res = await fetch("/api/admin/release-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        archived_at: archive ? new Date().toISOString() : null,
      }),
    });
    setArchivingId(null);
    if (!res.ok) alert("Не ўдалося змяніць архіў");
    await load();
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Выдаліць гэту заяўку на рэліз і ўсе трэкі беззваротна?")) return;
    setDeletingId(id);
    const res = await fetch("/api/admin/release-submissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeletingId(null);
    if (!res.ok) {
      alert("Не ўдалося выдаліць заяўку");
      return;
    }
    await load();
  };

  const activeCount = items.filter((i) => i.archived_at == null).length;
  const archivedCount = items.filter((i) => i.archived_at != null).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <TabButton active={queueView === "active"} onClick={() => setQueueView("active")}>
          Актыўныя ({activeCount})
        </TabButton>
        <TabButton active={queueView === "archived"} onClick={() => setQueueView("archived")}>
          Архів ({archivedCount})
        </TabButton>
      </div>

      <div className="glass rounded-2xl border border-border p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Загружаецца…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пакуль няма заявак з кабінета артыста.</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {queueView === "active" ? "Няма актыўных заявак." : "Архів пусты."}
          </p>
        ) : (
          <div className="space-y-6">
            {filteredItems.map((item) => {
              const listPreviewSrc = item.cover_url?.trim() || firstSortedTrackCoverUrl(item);
              return (
                <div key={item.id} className="rounded-xl border border-border p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    <div className="flex flex-wrap items-start gap-4 shrink-0">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Вокладка рэлізу</p>
                        {item.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover_url}
                            alt=""
                            className="min-w-[10rem] w-40 h-40 aspect-square rounded-xl object-cover border border-border"
                          />
                        ) : (
                          <div className="min-w-[10rem] w-40 h-40 aspect-square rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground text-center px-2">
                            Няма вокладкі
                          </div>
                        )}
                      </div>
                      {item.release_kind === "single" && item.tracks.some((t) => t.cover_url) ? (
                        <div className="space-y-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Вокладкі трэкаў (сінгл)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.tracks.map((t) => (
                              <div key={t.id} className="shrink-0">
                                {t.cover_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={t.cover_url}
                                    alt=""
                                    title={t.title || "Трэк"}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-border aspect-square"
                                  />
                                ) : (
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-muted border border-dashed border-border aspect-square" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-medium text-foreground">{item.title || "Без назвы"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {RELEASE_KIND_LABELS[item.release_kind]} ·{" "}
                            {item.artist ? (
                              <Link
                                href={`/speu/artists/${item.artist.slug}`}
                                className="text-primary hover:underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {item.artist.name}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Абноўлена:{" "}
                            <span className="font-mono text-foreground/80">{formatDateTime(item.updated_at)}</span>
                            {item.archived_at ? (
                              <>
                                {" "}
                                · у архіве з{" "}
                                <span className="font-mono">{formatDateTime(item.archived_at)}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <select
                            value={item.status}
                            onChange={(e) => void changeStatus(item.id, e.target.value as ReleaseSubmissionStatus)}
                            className="min-h-9 px-2 py-1.5 rounded-md bg-muted border border-border text-xs min-w-[10rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            {releaseStatuses.map((status) => (
                              <option key={status} value={status}>
                                {RELEASE_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                          {item.archived_at == null ? (
                            <button
                              type="button"
                              disabled={archivingId === item.id}
                              onClick={() => void setArchived(item.id, true)}
                              className="min-h-9 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              {archivingId === item.id ? "…" : "У архів"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={archivingId === item.id}
                              onClick={() => void setArchived(item.id, false)}
                              className="min-h-9 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              {archivingId === item.id ? "…" : "Вярнуць"}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => void deleteSubmission(item.id)}
                            className="inline-flex items-center gap-1 min-h-9 px-2.5 py-1.5 rounded-md border border-destructive/40 text-destructive text-xs hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Выдаліць
                          </button>
                        </div>
                      </div>

                      {listPreviewSrc ? (
                        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={listPreviewSrc}
                            alt=""
                            className="w-10 h-10 rounded-md object-cover border border-border shrink-0 aspect-square"
                          />
                          <p className="text-xs text-muted-foreground leading-snug">
                            {item.cover_url?.trim()
                              ? "Прэвю ў спісе (як на плошцы) — тая ж выява ў меншым памеры."
                              : "Прэвю як у спісе трэкаў — вокладка першага трэка (сінгл без агульнай вокладкі)."}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {item.artist_note ? (
                    <div className="text-sm border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground mb-1">Заўвага артыста</p>
                      <p className="text-foreground whitespace-pre-wrap">{item.artist_note}</p>
                    </div>
                  ) : null}

                  {item.tracks.length > 0 ? (
                    <div className="text-sm border-t border-border pt-3 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground">Трэкі</p>
                      <ul className="space-y-4">
                        {item.tracks.map((t) => (
                          <li
                            key={t.id}
                            className="rounded-lg border border-border/80 bg-muted/10 p-3 flex flex-col sm:flex-row gap-3"
                          >
                            <div className="flex items-start gap-3 shrink-0">
                              {t.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={t.cover_url}
                                  alt=""
                                  className="w-12 h-12 rounded-md object-cover border border-border aspect-square"
                                />
                              ) : item.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.cover_url}
                                  alt=""
                                  className="w-12 h-12 rounded-md object-cover border border-border aspect-square opacity-80"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-md bg-muted border border-border aspect-square" />
                              )}
                              <div className="min-w-0 sm:hidden">
                                <p className="text-sm font-medium text-foreground">{t.title || "Без назвы"}</p>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <p className="text-sm font-medium text-foreground hidden sm:block">
                                {t.title || "Без назвы"}
                              </p>
                              {t.audio_url ? (
                                <audio src={t.audio_url} controls className="w-full max-w-md h-9" />
                              ) : (
                                <p className="text-xs text-muted-foreground">Няма аўдыё</p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {t.duration_sec != null && t.duration_sec > 0 ? (
                                  <span className="font-mono tabular-nums">{formatTrackDuration(t.duration_sec)}</span>
                                ) : null}
                                {t.artist_track_id ? (
                                  <span>
                                    →{" "}
                                    <Link href="/admin/label/songs" className="text-primary hover:underline">
                                      у каталозе (чарнік)
                                    </Link>
                                  </span>
                                ) : null}
                                {t.audio_url ? (
                                  <a
                                    href={t.audio_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    адкрыць файл
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="border-t border-border pt-3 space-y-2">
                    <label className="block text-xs text-muted-foreground">Каментар для артыста (мадэратар)</label>
                    <textarea
                      value={messageDrafts[item.id] ?? ""}
                      onChange={(e) =>
                        setMessageDrafts((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-md bg-muted border border-border px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      placeholder="Тэкст убачыць артыст у кабінеце…"
                    />
                    <button
                      type="button"
                      disabled={savingId === item.id}
                      onClick={() => void saveModeratorMessage(item.id)}
                      className="min-h-9 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {savingId === item.id ? "Захаванне…" : "Захаваць каментар"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
