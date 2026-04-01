"use client";

import { useEffect, useState } from "react";

type ServiceRequest = {
  id: string;
  name: string;
  email: string;
  service_type: string;
  status: "new" | "in_progress" | "done" | "rejected";
  created_at: string;
};

const statuses: ServiceRequest["status"][] = ["new", "in_progress", "done", "rejected"];

export default function AdminServiceRequestsPage() {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Заяўкі</h1>
        <p className="text-sm text-muted-foreground">Входящие обращения с формы услуг.</p>
      </div>

      <div className="glass rounded-2xl border border-border p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет заявок.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.email} · {item.service_type}</p>
                  </div>
                  <select
                    value={item.status}
                    onChange={(e) => void changeStatus(item.id, e.target.value as ServiceRequest["status"])}
                    className="px-2 py-1.5 rounded-md bg-muted border border-border text-xs"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
