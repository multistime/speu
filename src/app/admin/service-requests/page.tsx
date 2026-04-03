"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

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

const statuses: ServiceRequest["status"][] = ["new", "in_progress", "done", "rejected"];

const statusLabels: Record<ServiceRequest["status"], string> = {
  new: "Новая",
  in_progress: "У працы",
  done: "Выканана",
  rejected: "Адхілена",
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

export default function AdminServiceRequestsPage() {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/service-requests");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  };

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
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Заяўкі</h1>
        <p className="text-sm text-muted-foreground">
          Звароты з формы паслуг: поўныя даныя, час адпраўкі, статус і выдаленне.
        </p>
      </div>

      <div className="glass rounded-2xl border border-border p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Загружаецца…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пакуль няма заявак.</p>
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
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
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
    </div>
  );
}
