"use client";

import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { formatTrackDuration } from "@/components/speu/speu-format-duration";
import {
  RELEASE_KIND_LABELS,
  RELEASE_STATUS_LABELS,
  type ReleaseKind,
  type ReleaseSubmissionStatus,
} from "@/lib/speu/release-submissions";

type ServiceRequest = {
  id: string;
  name: string;
  email: string;
  service_type: string;
  description: string;
  budget: string | null;
  deadline: string | null;
  status: "new" | "in_progress" | "done" | "rejected";
  source: string;
  created_at: string;
  updated_at: string;
};

const serviceStatuses: ServiceRequest["status"][] = ["new", "in_progress", "done", "rejected"];

const serviceStatusLabels: Record<ServiceRequest["status"], string> = {
  new: "Новая",
  in_progress: "У працы",
  done: "Выканана",
  rejected: "Адхілена",
};

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
    artist_track_id: string | null;
  }>;
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
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
        props.active
          ? "bg-primary/15 border-primary/40 text-foreground"
          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      {props.children}
    </button>
  );
}

function ServiceRequestsPanel() {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/service-requests");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/service-requests")
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const changeStatus = async (id: string, status: ServiceRequest["status"]) => {
    await fetch("/api/admin/service-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Выдаліць гэту заяўку беззваротна?")) return;
    setDeletingId(id);
    const res = await fetch("/api/admin/service-requests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeletingId(null);
    if (res.ok) await load();
  };

  return (
    <div className="glass rounded-2xl border border-border p-6">
      {loading ? (
        <p className="text-sm text-muted-foreground">Загружаецца…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пакуль няма заявак з формы паслуг.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <a href={`mailto:${item.email}`} className="text-primary hover:underline">
                      {item.email}
                    </a>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Адпраўлена:{" "}
                    <span className="font-mono text-foreground/80">{formatDateTime(item.created_at)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) => void changeStatus(item.id, e.target.value as ServiceRequest["status"])}
                    className="px-2 py-1.5 rounded-md bg-muted border border-border text-xs min-w-[9rem]"
                  >
                    {serviceStatuses.map((status) => (
                      <option key={status} value={status}>
                        {serviceStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void deleteRequest(item.id)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-destructive/40 text-destructive text-xs hover:bg-destructive/10 disabled:opacity-50"
                    title="Выдаліць заяўку"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Выдаліць
                  </button>
                </div>
              </div>

              <dl className="grid gap-2 text-sm border-t border-border pt-3">
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Тып паслугі / тэма</dt>
                  <dd className="text-foreground">{item.service_type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Апісанне</dt>
                  <dd className="text-foreground whitespace-pre-wrap">{item.description}</dd>
                </div>
                {(item.budget || item.deadline) && (
                  <div className="flex flex-wrap gap-4">
                    {item.budget ? (
                      <div>
                        <dt className="text-xs text-muted-foreground mb-0.5">Бюджэт</dt>
                        <dd className="text-foreground">{item.budget}</dd>
                      </div>
                    ) : null}
                    {item.deadline ? (
                      <div>
                        <dt className="text-xs text-muted-foreground mb-0.5">Тэрмін</dt>
                        <dd className="text-foreground font-mono text-xs">{item.deadline}</dd>
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Крыніца: {item.source}</span>
                  <span>
                    Абноўлена: <span className="font-mono">{formatDateTime(item.updated_at)}</span>
                  </span>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LabelSubmissionsPanel() {
  const [items, setItems] = useState<ReleaseSubmissionAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/release-submissions");
    const data = await res.json();
    const list = (data.items ?? []) as ReleaseSubmissionAdminItem[];
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

  return (
    <div className="glass rounded-2xl border border-border p-6">
      {loading ? (
        <p className="text-sm text-muted-foreground">Загружаецца…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пакуль няма заявак з кабінета артыста.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex flex-wrap items-start gap-3">
                {item.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.cover_url}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted border border-border shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{item.title || "Без назвы"}</p>
                  <p className="text-xs text-muted-foreground">
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
                  <p className="text-xs text-muted-foreground">
                    Абноўлена:{" "}
                    <span className="font-mono text-foreground/80">{formatDateTime(item.updated_at)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                  <select
                    value={item.status}
                    onChange={(e) => void changeStatus(item.id, e.target.value as ReleaseSubmissionStatus)}
                    className="px-2 py-1.5 rounded-md bg-muted border border-border text-xs min-w-[10rem]"
                  >
                    {releaseStatuses.map((status) => (
                      <option key={status} value={status}>
                        {RELEASE_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {item.artist_note ? (
                <div className="text-sm border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Заўвага артыста</p>
                  <p className="text-foreground whitespace-pre-wrap">{item.artist_note}</p>
                </div>
              ) : null}

              {item.tracks.length > 0 ? (
                <div className="text-sm border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Трэкі</p>
                  <ol className="list-decimal list-inside space-y-1 text-foreground">
                    {item.tracks.map((t) => (
                      <li key={t.id}>
                        <span>{t.title || "Без назвы"}</span>
                        {t.audio_url ? (
                          <a
                            href={t.audio_url}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 text-xs text-primary hover:underline"
                          >
                            аўдыё
                          </a>
                        ) : null}
                        {t.duration_sec != null && t.duration_sec > 0 ? (
                          <span className="ml-2 text-xs font-mono text-muted-foreground tabular-nums">
                            {formatTrackDuration(t.duration_sec)}
                          </span>
                        ) : null}
                        {t.artist_track_id ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            →{" "}
                            <Link href="/admin/label" className="text-primary hover:underline">
                              у каталозе (чарнік)
                            </Link>
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
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
                  className="w-full rounded-md bg-muted border border-border px-3 py-2 text-sm text-foreground"
                  placeholder="Тэкст убачыць артыст у кабінеце…"
                />
                <button
                  type="button"
                  disabled={savingId === item.id}
                  onClick={() => void saveModeratorMessage(item.id)}
                  className="px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted disabled:opacity-50"
                >
                  {savingId === item.id ? "Захаванне…" : "Захаваць каментар"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminServiceRequestsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawTab = searchParams.get("tab");
  const tab: "label" | "services" = rawTab === "label" ? "label" : "services";

  const setTab = (next: "label" | "services") => {
    const q = next === "services" ? "" : "?tab=label";
    router.replace(`${pathname}${q}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Заяўкі</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Заяўкі на рэліз з кабінета артыста і звароты з формы паслуг.
        </p>
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "label"} onClick={() => setTab("label")}>
            Лэйбл
          </TabButton>
          <TabButton active={tab === "services"} onClick={() => setTab("services")}>
            Паслугі
          </TabButton>
        </div>
      </div>

      {tab === "label" ? <LabelSubmissionsPanel /> : <ServiceRequestsPanel />}
    </div>
  );
}

export default function AdminServiceRequestsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground p-6">Загружаецца…</p>}>
      <AdminServiceRequestsPageInner />
    </Suspense>
  );
}
