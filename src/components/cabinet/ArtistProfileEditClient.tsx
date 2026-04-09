"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Palette, Share2, Upload, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";
import { linkedArtistCanEditProfile, profileOwnsArtist } from "@/lib/cabinet/artist-access";
import {
  ARTIST_COLOR_PRESETS,
  ARTIST_PATTERN_LABELS,
  type ArtistColorPresetId,
  type ArtistPatternId,
} from "@/lib/artists/visual-theme";
import { imageUploadContentType } from "@/lib/speu/storage-upload-mime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProfilePayload = {
  slug: string;
  name: string;
  nameEn: string;
  tagline: string;
  bio: string;
  location: string;
  yearStarted: number | null;
  initials: string;
  colorPreset: ArtistColorPresetId | "custom";
  pattern: ArtistPatternId;
  customGradientFrom: string;
  customGradientTo: string;
  customAccent: string;
  instagram: string;
  youtube: string;
  spotify: string;
  telegram: string;
  photoUrl: string;
};

function storageUploadUserMessage(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("too large") ||
    m.includes("file size") ||
    m.includes("exceeded") ||
    m.includes("payload too large") ||
    m.includes("413")
  ) {
    return "Выява занадта вялікая. Дазволена да ~5 МБ; сцісніце файл.";
  }
  if (m.includes("mime") || m.includes("invalid type") || m.includes("not allowed") || m.includes("content type")) {
    return "Сховішча адхіліла тып выявы. Выкарыстоўвайце JPEG, PNG, WebP або GIF.";
  }
  return message;
}

export function ArtistProfileEditClient({ artistId }: { artistId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<ProfilePayload | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    if (!artistId) {
      setAllowed(false);
      setLoading(false);
      return;
    }
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
      setErr("Няма доступу да гэтай картачкі артыста.");
      setLoading(false);
      return;
    }
    if (!linkedArtistCanEditProfile(profile, artistId)) {
      setAllowed(false);
      setErr(
        "Рэдагаванне картачкі на сайце адключана лэйблам. Калі патрэбныя змены — звярніцеся да Спеў.",
      );
      setLoading(false);
      return;
    }
    setAllowed(true);

    const res = await fetch(`/api/cabinet/artist/${artistId}/profile`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(
        typeof data.message === "string"
          ? data.message
          : typeof data.details === "string"
            ? data.details
            : "Не ўдалося загрузіць картачку.",
      );
      setForm(null);
      setLoading(false);
      return;
    }
    setForm({
      slug: data.slug ?? "",
      name: data.name ?? "",
      nameEn: data.nameEn ?? "",
      tagline: data.tagline ?? "",
      bio: data.bio ?? "",
      location: data.location ?? "",
      yearStarted: typeof data.yearStarted === "number" ? data.yearStarted : null,
      initials: data.initials ?? "",
      colorPreset: data.colorPreset ?? "default",
      pattern: data.pattern ?? "diamond",
      customGradientFrom: data.customGradientFrom ?? "#2B5035",
      customGradientTo: data.customGradientTo ?? "#0E1811",
      customAccent: data.customAccent ?? "#7DBF9E",
      instagram: data.instagram ?? "",
      youtube: data.youtube ?? "",
      spotify: data.spotify ?? "",
      telegram: data.telegram ?? "",
      photoUrl: data.photoUrl ?? "",
    });
    setLoading(false);
  }, [artistId, router, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setErr(null);
    const res = await fetch(`/api/cabinet/artist/${artistId}/profile`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        nameEn: form.nameEn || undefined,
        tagline: form.tagline || undefined,
        bio: form.bio || undefined,
        location: form.location || undefined,
        yearStarted: form.yearStarted,
        initials: form.initials || undefined,
        colorPreset: form.colorPreset,
        pattern: form.pattern,
        ...(form.colorPreset === "custom"
          ? {
              customGradientFrom: form.customGradientFrom,
              customGradientTo: form.customGradientTo,
              customAccent: form.customAccent,
            }
          : {}),
        instagram: form.instagram || undefined,
        youtube: form.youtube || undefined,
        spotify: form.spotify || undefined,
        telegram: form.telegram || undefined,
        photoUrl: form.photoUrl.trim() ? form.photoUrl.trim() : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      const fieldHint =
        typeof data.field === "string" && data.field ? ` (${data.field})` : "";
      setErr(
        typeof data.details === "string"
          ? `${data.error ?? "Памылка"}: ${data.details}${fieldHint}`
          : data.error ?? "Не ўдалося захаваць",
      );
      return;
    }
    const d = data as Partial<ProfilePayload> & { slug?: string };
    if (d && typeof d === "object" && "name" in d) {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              slug: d.slug ?? prev.slug,
              name: d.name ?? prev.name,
              nameEn: d.nameEn ?? prev.nameEn,
              tagline: d.tagline ?? prev.tagline,
              bio: d.bio ?? prev.bio,
              location: d.location ?? prev.location,
              yearStarted: d.yearStarted ?? prev.yearStarted,
              initials: d.initials ?? prev.initials,
              colorPreset: d.colorPreset ?? prev.colorPreset,
              pattern: d.pattern ?? prev.pattern,
              customGradientFrom: d.customGradientFrom ?? prev.customGradientFrom,
              customGradientTo: d.customGradientTo ?? prev.customGradientTo,
              customAccent: d.customAccent ?? prev.customAccent,
              instagram: d.instagram ?? prev.instagram,
              youtube: d.youtube ?? prev.youtube,
              spotify: d.spotify ?? prev.spotify,
              telegram: d.telegram ?? prev.telegram,
              photoUrl: d.photoUrl ?? prev.photoUrl,
            }
          : prev,
      );
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!form) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setErr(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `artist-profile/${artistId}/photo-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("speu-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: imageUploadContentType(file),
    });
    if (upErr) {
      setErr(storageUploadUserMessage(upErr.message));
      return;
    }
    const { data: pub } = supabase.storage.from("speu-images").getPublicUrl(path);
    setForm((prev) => (prev ? { ...prev, photoUrl: pub.publicUrl } : prev));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
      </div>
    );
  }

  if (!allowed && !form) {
    return (
      <div className="glass rounded-2xl border border-border p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">{err ?? "Няма доступу."}</p>
        <Link href={`/cabinet/artist/${artistId}/analytics`} className="text-sm text-primary hover:underline">
          Да аналітыкі
        </Link>
      </div>
    );
  }

  if (allowed && !form && err) {
    return (
      <div className="glass rounded-2xl border border-border p-8 text-center space-y-4">
        <p className="text-sm text-destructive">{err}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Паспрабаваць яшчэ
        </Button>
        <div>
          <Link href={`/cabinet/artist/${artistId}/analytics`} className="text-sm text-primary hover:underline">
            Да аналітыкі
          </Link>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl italic text-foreground">Наладкі</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Гэта публічная старонка артыста ў каталогу. Slug у URL (
          <span className="font-mono text-xs">{form.slug}</span>) змяняе толькі лэйбл.
        </p>
      </div>

      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}

      <Tabs defaultValue="basics" className="gap-0">
        <TabsList
          variant="line"
          className="mb-4 h-auto min-h-9 w-full max-w-full flex-wrap justify-start gap-x-1 gap-y-1 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger value="basics" className="gap-1.5 rounded-none px-3 py-2 after:bottom-0">
            <UserRound className="size-4 opacity-70" strokeWidth={1.75} />
            Асноўнае
          </TabsTrigger>
          <TabsTrigger value="photo" className="gap-1.5 rounded-none px-3 py-2 after:bottom-0">
            <ImageIcon className="size-4 opacity-70" strokeWidth={1.75} />
            Фота
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5 rounded-none px-3 py-2 after:bottom-0">
            <Share2 className="size-4 opacity-70" strokeWidth={1.75} />
            Сацсеткі
          </TabsTrigger>
          <TabsTrigger value="visual" className="gap-1.5 rounded-none px-3 py-2 after:bottom-0">
            <Palette className="size-4 opacity-70" strokeWidth={1.75} />
            Візуал
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="mt-0">
          <div className="glass rounded-2xl border border-border p-6 space-y-1">
            <p className="text-sm text-muted-foreground pb-4">
              Назва, апісанне і даныя, якія бачныя ў каталозе.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ap-name">Назва *</Label>
                <Input
                  id="ap-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-name-en">Назва (EN)</Label>
                <Input
                  id="ap-name-en"
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => (f ? { ...f, nameEn: e.target.value } : f))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-tagline">Слоган</Label>
                <Input
                  id="ap-tagline"
                  value={form.tagline}
                  onChange={(e) => setForm((f) => (f ? { ...f, tagline: e.target.value } : f))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ap-bio">Біяграфія</Label>
                <Textarea
                  id="ap-bio"
                  rows={5}
                  value={form.bio}
                  onChange={(e) => setForm((f) => (f ? { ...f, bio: e.target.value } : f))}
                  className="resize-y min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-loc">Лакацыя</Label>
                <Input
                  id="ap-loc"
                  value={form.location}
                  onChange={(e) => setForm((f) => (f ? { ...f, location: e.target.value } : f))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-year">Год пачатку</Label>
                <Input
                  id="ap-year"
                  type="number"
                  value={form.yearStarted ?? ""}
                  onChange={(e) =>
                    setForm((f) => {
                      if (!f) return f;
                      const t = e.target.value;
                      if (t === "") return { ...f, yearStarted: null };
                      const n = Number.parseInt(t, 10);
                      return { ...f, yearStarted: Number.isFinite(n) ? n : null };
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-ini">Ініцыялы</Label>
                <Input
                  id="ap-ini"
                  value={form.initials}
                  onChange={(e) => setForm((f) => (f ? { ...f, initials: e.target.value } : f))}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="photo" className="mt-0">
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Партрэт у каталозе: укажыце спасылку або загрузіце файл (да ~5 МБ).
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label htmlFor="ap-photo-url">URL або загрузіце файл</Label>
                <Input
                  id="ap-photo-url"
                  value={form.photoUrl}
                  onChange={(e) => setForm((f) => (f ? { ...f, photoUrl: e.target.value } : f))}
                  placeholder="https://..."
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void uploadPhoto(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Загрузіць
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="social" className="mt-0">
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Спасылкі на профілі ў сацыяльных сетках і стрымінгу.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["instagram", "Instagram"],
                  ["youtube", "YouTube"],
                  ["spotify", "Spotify"],
                  ["telegram", "Telegram"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`ap-${key}`}>{label}</Label>
                  <Input
                    id={`ap-${key}`}
                    value={form[key]}
                    onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
                    placeholder="https://…"
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visual" className="mt-0">
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Колер, узор фону і ўласны градыент для старонкі артыста ў каталозе.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Колеравая схема</Label>
                <Select
                  value={form.colorPreset}
                  onValueChange={(v) =>
                    setForm((f) => (f ? { ...f, colorPreset: v as ArtistColorPresetId | "custom" } : f))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTIST_COLOR_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Свой градыент</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Узор фону</Label>
                <Select
                  value={form.pattern}
                  onValueChange={(v) =>
                    setForm((f) => (f ? { ...f, pattern: v as ArtistPatternId } : f))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ARTIST_PATTERN_LABELS).map(([id, lab]) => (
                      <SelectItem key={id} value={id}>
                        {lab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.colorPreset === "custom" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["customGradientFrom", "Градыент ад"],
                    ["customGradientTo", "Градыент да"],
                    ["customAccent", "Акцэнт"],
                  ] as const
                ).map(([key, lab]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`ap-${key}`}>{lab}</Label>
                    <Input
                      id={`ap-${key}`}
                      value={form[key]}
                      onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
                      placeholder="#RRGGBB"
                      className="font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" onClick={() => void save()} disabled={saving || !form.name.trim()}>
          {saving ? "Захаванне…" : "Захаваць"}
        </Button>
      </div>
    </div>
  );
}
