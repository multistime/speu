"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";
import {
  RELEASE_KIND_LABELS,
  RELEASE_STATUS_LABELS,
  getReleaseSubmissionSubmitError,
  submissionArtistCanDelete,
  submissionIsEditable,
  type ReleaseKind,
  type ReleaseSubmissionRow,
  type ReleaseSubmissionTrackRow,
} from "@/lib/speu/release-submissions";
import { getAudioDurationSecFromFile } from "@/lib/speu/audio-duration";
import { audioUploadContentType, imageUploadContentType } from "@/lib/speu/storage-upload-mime";
import { formatTrackDuration } from "@/components/speu/speu-format-duration";
import { cn } from "@/lib/utils";

function storageUploadUserMessage(message: string, kind: "image" | "audio"): string {
  const m = message.toLowerCase();
  if (
    m.includes("too large") ||
    m.includes("file size") ||
    m.includes("exceeded") ||
    m.includes("payload too large") ||
    m.includes("413")
  ) {
    return kind === "image"
      ? "Выява занадта вялікая. Пасля абнаўлення сховішча дазволена да ~12 МБ; інакш сцісніце PNG/JPEG."
      : "Файл аўдыё занадта вялікі. Пасля абнаўлення сховішча дазволена да ~150 МБ; можна таксама загрузіць MP3/FLAC меншага памеру.";
  }
  if (m.includes("mime") || m.includes("invalid type") || m.includes("not allowed") || m.includes("content type")) {
    return kind === "image"
      ? "Сховішча адхіліла тып выявы. Выкарыстоўвайце JPEG, PNG, WebP або GIF; паспрабуйце іншы браўзер, калі type файла пусты."
      : "Сховішча адхіліла тып аўдыё. Для WAV патрэбна пашырэнне .wav; таксама даступныя MP3 і OGG.";
  }
  return message;
}

export default function ArtistSubmissionPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<ReleaseSubmissionRow | null>(null);
  const [tracks, setTracks] = useState<ReleaseSubmissionTrackRow[]>([]);

  const [title, setTitle] = useState("");
  const [releaseKind, setReleaseKind] = useState<ReleaseKind>("single");
  const [artistNote, setArtistNote] = useState("");

  const editable = submission ? submissionIsEditable(submission.status) : false;

  const submitBlockedReason = useMemo(() => {
    if (!submission || !editable) return null;
    return getReleaseSubmissionSubmitError({
      release_kind: releaseKind,
      title,
      cover_url: submission.cover_url,
      tracks: tracks.map((t) => ({
        title: t.title,
        audio_url: t.audio_url,
        cover_url: t.cover_url ?? null,
      })),
    });
  }, [submission, editable, releaseKind, title, tracks]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/cabinet");
      return;
    }
    const profile = await getSpeuProfile(supabase, user.id);
    if (!profile?.is_artist) {
      router.replace("/cabinet");
      return;
    }

    const { data: sub, error: sErr } = await supabase
      .schema("speu")
      .from("release_submissions")
      .select(
        "id, artist_id, user_id, release_kind, status, title, cover_url, cover_storage_path, artist_note, moderator_message, archived_at, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (sErr || !sub || sub.user_id !== user.id) {
      setSubmission(null);
      setLoading(false);
      return;
    }

    const row = {
      ...(sub as ReleaseSubmissionRow),
      archived_at: (sub as { archived_at?: string | null }).archived_at ?? null,
    };
    setSubmission(row);
    setTitle(row.title ?? "");
    setReleaseKind(row.release_kind);
    setArtistNote(row.artist_note ?? "");

    const { data: tr, error: tErr } = await supabase
      .schema("speu")
      .from("release_submission_tracks")
      .select(
        "id, submission_id, sort_order, title, audio_url, audio_storage_path, cover_url, cover_storage_path, duration_sec, notes, lyrics, artist_track_id, created_at, updated_at",
      )
      .eq("submission_id", id)
      .order("sort_order", { ascending: true });

    if (tErr) {
      setError(tErr.message);
      setTracks([]);
    } else {
      setTracks(
        (tr ?? []).map((t) => ({
          ...(t as ReleaseSubmissionTrackRow),
          cover_url: (t as { cover_url?: string | null }).cover_url ?? null,
          cover_storage_path: (t as { cover_storage_path?: string | null }).cover_storage_path ?? null,
        })),
      );
    }
    setLoading(false);
  }, [id, router, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistSubmission = async (patch: Partial<ReleaseSubmissionRow>) => {
    if (!submission) return;
    const { error: uErr } = await supabase
      .schema("speu")
      .from("release_submissions")
      .update(patch)
      .eq("id", submission.id);
    if (uErr) throw new Error(uErr.message);
  };

  const saveAll = async (): Promise<boolean> => {
    if (!submission || !editable) return false;
    setSaving(true);
    setError(null);
    try {
      let trackRows = tracks;
      const fillRes = await fetch(
        `/api/artist/release-submissions/${submission.id}/fill-track-durations`,
        { method: "POST" },
      );
      if (fillRes.ok) {
        const payload = (await fillRes.json()) as {
          resolved?: { id: string; duration_sec: number }[];
        };
        const resolved = payload.resolved ?? [];
        if (resolved.length > 0) {
          trackRows = tracks.map((t) => {
            const r = resolved.find((x) => x.id === t.id);
            return r ? { ...t, duration_sec: r.duration_sec } : t;
          });
          setTracks(trackRows);
        }
      }

      await persistSubmission({
        title: title.trim(),
        release_kind: releaseKind,
        artist_note: artistNote.trim() || null,
      });
      for (const t of trackRows) {
        const { error: e } = await supabase
          .schema("speu")
          .from("release_submission_tracks")
          .update({
            title: t.title,
            notes: t.notes?.trim() || null,
            lyrics: t.lyrics?.trim() || null,
            audio_url: t.audio_url,
            audio_storage_path: t.audio_storage_path,
            cover_url: t.cover_url,
            cover_storage_path: t.cover_storage_path,
            duration_sec: t.duration_sec ?? null,
          })
          .eq("id", t.id);
        if (e) throw new Error(e.message);
      }
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Памылка захавання");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadAudio = async (track: ReleaseSubmissionTrackRow, file: File) => {
    if (!submission || !editable) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setError(null);
    const durationSec = await getAudioDurationSecFromFile(file);
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const path = `submission-drafts/${user.id}/${submission.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("speu-audio").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: audioUploadContentType(file),
    });
    if (upErr) {
      setError(storageUploadUserMessage(upErr.message, "audio"));
      return;
    }
    const { data: pub } = supabase.storage.from("speu-audio").getPublicUrl(path);
    setTracks((prev) =>
      prev.map((x) =>
        x.id === track.id
          ? {
              ...x,
              audio_url: pub.publicUrl,
              audio_storage_path: path,
              duration_sec: durationSec,
            }
          : x,
      ),
    );
  };

  const uploadCover = async (file: File) => {
    if (!submission || !editable) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `submission-drafts/${user.id}/${submission.id}/cover-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("speu-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: imageUploadContentType(file),
    });
    if (upErr) {
      setError(storageUploadUserMessage(upErr.message, "image"));
      return;
    }
    const { data: pub } = supabase.storage.from("speu-images").getPublicUrl(path);
    try {
      await persistSubmission({ cover_url: pub.publicUrl, cover_storage_path: path });
      setSubmission((s) => (s ? { ...s, cover_url: pub.publicUrl, cover_storage_path: path } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не ўдалося захаваць вокладку");
    }
  };

  const uploadTrackCover = async (track: ReleaseSubmissionTrackRow, file: File) => {
    if (!submission || !editable) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `submission-drafts/${user.id}/${submission.id}/track-${track.id}/cover-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("speu-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: imageUploadContentType(file),
    });
    if (upErr) {
      setError(storageUploadUserMessage(upErr.message, "image"));
      return;
    }
    const { data: pub } = supabase.storage.from("speu-images").getPublicUrl(path);
    updateTrackLocal(track.id, { cover_url: pub.publicUrl, cover_storage_path: path });
  };

  const addTrack = async () => {
    if (!submission || !editable) return;
    const nextOrder = tracks.length === 0 ? 0 : Math.max(...tracks.map((t) => t.sort_order)) + 1;
    const { data, error: insErr } = await supabase
      .schema("speu")
      .from("release_submission_tracks")
      .insert({ submission_id: submission.id, sort_order: nextOrder, title: "" })
      .select(
        "id, submission_id, sort_order, title, audio_url, audio_storage_path, cover_url, cover_storage_path, duration_sec, notes, lyrics, artist_track_id, created_at, updated_at",
      )
      .single();
    if (insErr || !data) {
      setError(insErr?.message ?? "Не ўдалося дадаць трэк");
      return;
    }
    const tr = data as ReleaseSubmissionTrackRow;
    setTracks((prev) => [
      ...prev,
      {
        ...tr,
        cover_url: tr.cover_url ?? null,
        cover_storage_path: tr.cover_storage_path ?? null,
      },
    ]);
  };

  const removeTrack = async (trackId: string) => {
    if (!editable) return;
    const { error: dErr } = await supabase.schema("speu").from("release_submission_tracks").delete().eq("id", trackId);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const submitForReview = async () => {
    if (!submission || !editable) return;
    const msg = getReleaseSubmissionSubmitError({
      release_kind: releaseKind,
      title,
      cover_url: submission.cover_url,
      tracks: tracks.map((t) => ({
        title: t.title,
        audio_url: t.audio_url,
        cover_url: t.cover_url ?? null,
      })),
    });
    if (msg) {
      setError(msg);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const saved = await saveAll();
      if (!saved) return;
      await persistSubmission({ status: "submitted" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Памылка адпраўкі");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSubmission = async () => {
    if (!submission || !submissionArtistCanDelete(submission.status)) return;
    if (!window.confirm("Выдаліць заяўку і ўсе трэкі? Гэта незваротна.")) return;
    setDeleting(true);
    setError(null);
    const { error: dErr } = await supabase.schema("speu").from("release_submissions").delete().eq("id", submission.id);
    if (dErr) {
      setError(dErr.message);
      setDeleting(false);
      return;
    }
    router.replace("/cabinet/artist");
  };

  const updateTrackLocal = (trackId: string, patch: Partial<ReleaseSubmissionTrackRow>) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, ...patch } : t)));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="glass rounded-2xl border border-border p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Заяўка не знойдзена або няма доступу.</p>
        <Link href="/cabinet/artist" className="text-sm text-primary hover:underline inline-block">
          Да спісу заявак
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/cabinet/artist"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
          >
            ← Усе заяўкі
          </Link>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground italic">
            Рэдагаванне заяўкі
          </h1>
        </div>
        <span
          className={cn(
            "self-start text-xs font-medium px-2.5 py-1 rounded-full border",
            submission.status === "draft" && "bg-muted text-muted-foreground border-border",
            submission.status === "submitted" &&
              "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25",
            submission.status === "needs_changes" &&
              "bg-orange-500/12 text-orange-600 dark:text-orange-400 border-orange-500/25",
            submission.status === "approved" &&
              "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
            submission.status === "rejected" && "bg-destructive/10 text-destructive border-destructive/25",
          )}
        >
          {RELEASE_STATUS_LABELS[submission.status]}
        </span>
      </div>

      {submission.moderator_message && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/8 text-sm text-foreground px-4 py-3">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Каментар мадэратара</p>
          <p className="whitespace-pre-wrap">{submission.moderator_message}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="glass rounded-2xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Назва рэлізу</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!editable}
            className="w-full min-h-10 px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
          />
        </div>

        <div>
          <span className="block text-xs text-muted-foreground mb-2">Тып</span>
          <div className="flex flex-wrap gap-2">
            {(["single", "album"] as const).map((k) => (
              <button
                key={k}
                type="button"
                disabled={!editable}
                onClick={() => setReleaseKind(k)}
                className={cn(
                  "min-h-9 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  releaseKind === k
                    ? "bg-primary/12 border-primary/35 text-primary"
                    : "bg-muted/30 border-border text-muted-foreground hover:border-primary/20",
                )}
              >
                {RELEASE_KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        {releaseKind === "album" ? (
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Вокладка альбома{" "}
              <span className="text-muted-foreground/80">(абавязкова перад адпраўкай)</span>
            </label>
            {submission.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={submission.cover_url}
                alt=""
                className="min-w-[8rem] w-32 h-32 aspect-square rounded-xl object-cover border border-border mb-2"
              />
            ) : (
              <p className="text-xs text-muted-foreground mb-2">Пакуль без вокладкі</p>
            )}
            {editable && (
              <label className="inline-flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline">
                <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                Загрузіць файл
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void uploadCover(f);
                  }}
                />
              </label>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
            Для сінгла вокладку загружаеце да кожнага трэка ніжэй (абавязкова перад адпраўкай).
          </p>
        )}

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Нататка для лэйбла (неабавязкова)</label>
          <textarea
            value={artistNote}
            onChange={(e) => setArtistNote(e.target.value)}
            disabled={!editable}
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm outline-none focus:border-primary/40 disabled:opacity-60 resize-y min-h-[72px]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Трэкі</h2>
          {editable && (
            <button
              type="button"
              onClick={() => void addTrack()}
              className="min-h-10 px-2 -mr-2 rounded-lg text-xs font-medium text-primary hover:underline hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              + Дадаць трэк
            </button>
          )}
        </div>

        {tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Няма трэкаў. Дадайце хаця б адзін.</p>
        ) : (
          <ul className="space-y-4">
            {tracks.map((t, idx) => (
              <li key={t.id} className="glass rounded-2xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Трэк {idx + 1}</span>
                  {editable && tracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => void removeTrack(t.id)}
                      className="text-destructive/80 hover:text-destructive p-1 rounded-lg hover:bg-destructive/10"
                      aria-label="Выдаліць трэк"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Назва</label>
                  <input
                    value={t.title}
                    onChange={(e) => updateTrackLocal(t.id, { title: e.target.value })}
                    disabled={!editable}
                    className="w-full min-h-10 px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
                  />
                </div>
                {releaseKind === "single" && (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Вокладка трэка <span className="text-muted-foreground/80">(абавязкова)</span>
                    </label>
                    {t.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.cover_url}
                        alt=""
                        className="min-w-[9rem] w-36 h-36 aspect-square rounded-xl object-cover border border-border mb-2"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground mb-2">Пакуль без вокладкі</p>
                    )}
                    {editable && (
                      <label className="inline-flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline">
                        <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Загрузіць выяву
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) void uploadTrackCover(t, f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Аўдыё</label>
                  {t.audio_url ? (
                    <div className="space-y-1">
                      <audio src={t.audio_url} controls className="w-full h-9 mt-1" />
                      {t.duration_sec != null && t.duration_sec > 0 ? (
                        <p className="text-xs text-muted-foreground font-mono tabular-nums">
                          Даўжыня: {formatTrackDuration(t.duration_sec)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Файл не загружаны</p>
                  )}
                  {editable && (
                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline">
                      <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Загрузіць MP3 / WAV / OGG
                      <input
                        type="file"
                        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/x-wav"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) void uploadAudio(t, f);
                        }}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Тэкст песні (неабавязкова)</label>
                  <textarea
                    value={t.lyrics ?? ""}
                    onChange={(e) => updateTrackLocal(t.id, { lyrics: e.target.value })}
                    disabled={!editable}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm outline-none focus:border-primary/40 disabled:opacity-60 font-mono text-xs resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Каментар да трэка</label>
                  <input
                    value={t.notes ?? ""}
                    onChange={(e) => updateTrackLocal(t.id, { notes: e.target.value })}
                    disabled={!editable}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm outline-none focus:border-primary/40 disabled:opacity-60"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        {editable && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {submissionArtistCanDelete(submission.status) && (
                <button
                  type="button"
                  onClick={() => void deleteSubmission()}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 min-h-10 px-4 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60 border border-destructive/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  )}
                  Выдаліць заяўку
                </button>
              )}
              <button
                type="button"
                onClick={() => void saveAll()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Захаваць змены
              </button>
            </div>
            <div className="flex w-full sm:w-auto flex-1 sm:flex-initial flex-col items-stretch sm:items-end gap-1.5 min-w-0 sm:min-w-[11rem]">
              <button
                type="button"
                onClick={() => void submitForReview()}
                disabled={submitting || saving || submitBlockedReason != null}
                title={submitBlockedReason ?? undefined}
                className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Адправіць на мадэрацыю
              </button>
              {submitBlockedReason ? (
                <p className="text-xs text-muted-foreground text-center sm:text-right max-w-md sm:ml-auto">
                  {submitBlockedReason}
                </p>
              ) : null}
            </div>
          </>
        )}
        {!editable && (
          <p className="text-sm text-muted-foreground">
            Рэдагаванне недоступна ў гэтым статусе. Калі лэйбл папросіць праўкі, зноў адкрыецца магчымасць змяняць
            заяўку.
          </p>
        )}
      </div>
    </div>
  );
}
