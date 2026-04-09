"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_UI_ROLE_CODES,
  ADMIN_UI_ROLE_LABELS,
  STAFF_ROLE_LABELS,
  type AdminUiRoleCode,
} from "@/lib/admin/user-roles";

type AdminUserListItem = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  display_name: string | null;
  is_admin: boolean;
  is_superadmin?: boolean;
  role_codes: string[];
  product_role_codes: AdminUiRoleCode[];
  linked_artist: { id: string; name: string; slug: string } | null;
};

type CatalogArtist = { id: string; name: string; slug: string };

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("be-BY", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function roleLabel(code: string): string {
  if (code in ADMIN_UI_ROLE_LABELS) return ADMIN_UI_ROLE_LABELS[code as AdminUiRoleCode];
  return STAFF_ROLE_LABELS[code] ?? code;
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(30);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [selected, setSelected] = useState<AdminUserListItem | null>(null);
  const [editCodes, setEditCodes] = useState<AdminUiRoleCode[]>([]);
  const [linkedArtistId, setLinkedArtistId] = useState("");
  const [catalogArtists, setCatalogArtists] = useState<CatalogArtist[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/artists")
      .then((r) => r.json())
      .then((d: { items?: CatalogArtist[] }) => {
        if (!active) return;
        setCatalogArtists(d.items ?? []);
      })
      .catch(() => {
        if (!active) return;
        setCatalogArtists([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", String(perPage));
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false as const,
        error: (data.details ?? data.error ?? "Памылка загрузкі") as string,
      };
    }
    return {
      ok: true as const,
      items: (data.items ?? []) as AdminUserListItem[],
      total: typeof data.total === "number" ? data.total : 0,
    };
  }, [page, perPage, q]);

  useEffect(() => {
    let active = true;
    const task = Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError(null);
      const result = await load();
      if (!active) return;
      if (!result.ok) {
        setError(result.error);
        setItems([]);
      } else {
        setItems(result.items);
        setTotal(result.total);
      }
      setLoading(false);
    });
    return () => {
      active = false;
      void task;
    };
  }, [load]);

  const openUser = (u: AdminUserListItem) => {
    setSelected(u);
    const base = [...u.product_role_codes];
    if (u.is_superadmin && !base.includes("admin")) base.push("admin");
    setEditCodes(base);
    setLinkedArtistId(u.linked_artist?.id ?? "");
    setError(null);
  };

  const toggleCode = (code: AdminUiRoleCode) => {
    if (selected?.is_superadmin && code === "admin") return;
    setEditCodes((prev) => {
      if (prev.includes(code)) {
        if (code === "artist") setLinkedArtistId("");
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const saveRoles = async () => {
    if (!selected) return;
    if (editCodes.includes("artist") && !linkedArtistId) {
      setError("Пры ролі «артыст» абярыце карточку артыста лэйбла");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${selected.id}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codes: editCodes,
        linkedArtistId: editCodes.includes("artist") ? linkedArtistId : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? data.details ?? data.error ?? "Не атрымалася захаваць");
      return;
    }
    setSelected(null);
    setLoading(true);
    setError(null);
    const result = await load();
    if (result.ok) {
      setItems(result.items);
      setTotal(result.total);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const staffOnly = (codes: string[]) =>
    codes.filter((c) => !ADMIN_UI_ROLE_CODES.includes(c as AdminUiRoleCode));

  const showNext = !q.trim() && page * perPage < total;
  const showPrev = page > 1;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-start gap-3 mb-2">
          <Users className="w-8 h-8 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl italic text-foreground">Карыстальнікі</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Слухач — звычайны карыстальнік; артыст — прывязка 1:1 да карточкі артыста лэйбла (для будучага кабінета);
              адмін — доступ у адмінку.
            </p>
          </div>
        </div>
        <form
          className="flex flex-wrap gap-2 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(searchDraft);
          }}
        >
          <Input
            placeholder="Пошук (email, імя, UUID)…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="secondary">
            Шукаць
          </Button>
          {q ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchDraft("");
                setQ("");
                setPage(1);
              }}
            >
              Скінуць
            </Button>
          ) : null}
        </form>
      </div>

      {error && !selected ? (
        <p className="text-sm text-destructive px-1" role="alert">
          {error}
        </p>
      ) : null}

      <div className="glass rounded-2xl border border-border p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Загружаецца…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нічога не знойдзена.</p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium hidden sm:table-cell">Імя</th>
                    <th className="p-3 font-medium hidden lg:table-cell">Артыст лэйбла</th>
                    <th className="p-3 font-medium">Ролі</th>
                    <th className="p-3 font-medium w-32">Дзеянні</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => {
                    const codesForBadges =
                      u.role_codes.length > 0 ? u.role_codes : (u.product_role_codes ?? []);
                    return (
                    <tr key={u.id} className="border-b border-border/80 last:border-0 hover:bg-muted/20">
                      <td className="p-3 align-top">
                        <p className="font-mono text-xs break-all text-foreground">{u.email ?? "—"}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.is_superadmin ? (
                            <Badge variant="default" className="text-xs">
                              суперадмін
                            </Badge>
                          ) : null}
                          {u.is_admin ? (
                            <Badge variant="secondary" className="text-xs">
                              is_admin
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 align-top hidden sm:table-cell text-muted-foreground">
                        {u.display_name ?? "—"}
                      </td>
                      <td className="p-3 align-top hidden lg:table-cell text-sm text-muted-foreground">
                        {u.linked_artist?.name ?? "—"}
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {codesForBadges.length === 0 ? (
                            <span className="text-xs text-muted-foreground">без роляў у табліцы</span>
                          ) : (
                            codesForBadges.map((c) => (
                              <Badge key={c} variant="outline">
                                {roleLabel(c)}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openUser(u)}>
                          Падрабязна
                        </Button>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {!q.trim() && total > perPage ? (
              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  Старонка {page} · паказана {items.length} з ~{total}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!showPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!showNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Далей
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <AdminFormModal open={Boolean(selected)} onClose={() => setSelected(null)} maxWidthClassName="max-w-lg">
        {selected ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl italic text-foreground">Карыстальнік</h2>
              <p className="text-xs text-muted-foreground font-mono break-all mt-1">{selected.id}</p>
            </div>

            <dl className="grid gap-2 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-mono text-xs break-all">{selected.email ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Тэлефон</dt>
                <dd>{selected.phone ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Імя ў профілі</dt>
                <dd>{selected.display_name ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Створаны</dt>
                <dd>{formatDateTime(selected.created_at)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Апошні ўваход</dt>
                <dd>{formatDateTime(selected.last_sign_in_at)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Email пацверджаны</dt>
                <dd>{formatDateTime(selected.email_confirmed_at)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Профіль: адмін (даступ у адмінку)</dt>
                <dd>
                  {selected.is_admin ? "так" : "не"}
                  {selected.is_superadmin ? (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Галоўны адмін: ролю «Адмін» у спісе нельга адключыць; на серверы яна заўсёды захоўваецца.
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Карточка артыста лэйбла (1:1)</dt>
                <dd>{selected.linked_artist ? `${selected.linked_artist.name} (${selected.linked_artist.slug})` : "—"}</dd>
              </div>
            </dl>

            {staffOnly(selected.role_codes).length > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Службовыя ролі (толькі прагляд)
                </p>
                <div className="flex flex-wrap gap-1">
                  {staffOnly(selected.role_codes).map((c) => (
                    <Badge key={c} variant="secondary">
                      {roleLabel(c)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-sm font-medium text-foreground mb-3">Правы (можна змяняць)</p>
              <ul className="space-y-2">
                {ADMIN_UI_ROLE_CODES.map((code) => {
                  const lockedSuperadmin = Boolean(selected.is_superadmin && code === "admin");
                  return (
                    <li key={code}>
                      <label
                        className={`flex items-center gap-3 select-none ${lockedSuperadmin ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={editCodes.includes(code)}
                          disabled={lockedSuperadmin}
                          onChange={() => toggleCode(code)}
                          className="size-4 rounded border-border accent-primary disabled:cursor-not-allowed"
                        />
                        <span className="text-sm">{ADMIN_UI_ROLE_LABELS[code]}</span>
                        <span className="text-xs text-muted-foreground font-mono">({code})</span>
                        {lockedSuperadmin ? (
                          <span className="text-xs text-muted-foreground">· заўсёды ўключана</span>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                «Адмін» — доступ у адмінку. «Слухач» / «Артыст» — радкі ў{" "}
                <span className="font-mono">speu.user_roles</span>. Для «артыст» абавязкова выберыце карточку —
                захоўваецца ў <span className="font-mono">speu.artists.user_id</span>.
              </p>
            </div>

            {editCodes.includes("artist") ? (
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Карточка артыста лэйбла *</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={linkedArtistId}
                  onChange={(e) => setLinkedArtistId(e.target.value)}
                >
                  <option value="">— абярыце артыста —</option>
                  {catalogArtists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.slug})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {error && selected ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" onClick={saveRoles} disabled={saving}>
                {saving ? "Захаванне…" : "Захаваць ролі"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSelected(null)} disabled={saving}>
                Скасаваць
              </Button>
            </div>
          </div>
        ) : null}
      </AdminFormModal>
    </div>
  );
}
