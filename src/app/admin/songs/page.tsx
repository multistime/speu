"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Pencil, Upload, Music, Disc, X, Check } from "lucide-react";

type Artist = { id: string; name: string; slug: string };
type Album = {
  id: string;
  artist_id: string;
  title: string;
  cover_url: string | null;
  release_date: string | null;
  description: string | null;
  is_published: boolean;
  sort_order: number;
  artists?: { id: string; name: string; slug: string };
};
type Song = {
  id: string;
  artist_id: string;
  album_id: string | null;
  title: string;
  audio_url: string | null;
  external_url: string | null;
  cover_url: string | null;
  duration_sec: number | null;
  track_number: number | null;
  sort_order: number;
  is_published: boolean;
  artists?: { id: string; name: string; slug: string };
  albums?: { id: string; title: string } | null;
};

const emptyAlbumForm = {
  id: "",
  artistId: "",
  title: "",
  coverUrl: "",
  releaseDate: "",
  description: "",
  isPublished: false,
  sortOrder: 0,
};

const emptySongForm = {
  id: "",
  artistId: "",
  albumId: "",
  title: "",
  audioUrl: "",
  externalUrl: "",
  coverUrl: "",
  durationSec: "",
  trackNumber: "",
  sortOrder: 0,
  isPublished: true,
};

function formatDuration(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminSongsPage() {
  const [tab, setTab] = useState<"songs" | "albums">("songs");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Song form state
  const [songForm, setSongForm] = useState(emptySongForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Album form state
  const [albumForm, setAlbumForm] = useState(emptyAlbumForm);

  const loadAll = async () => {
    setLoading(true);
    const [artistsRes, albumsRes, songsRes] = await Promise.all([
      fetch("/api/admin/artists"),
      fetch("/api/admin/albums"),
      fetch("/api/admin/songs"),
    ]);
    const [ad, ald, sd] = await Promise.all([
      artistsRes.json(),
      albumsRes.json(),
      songsRes.json(),
    ]);
    setArtists(ad.items ?? []);
    setAlbums(ald.items ?? []);
    setSongs(sd.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Albums filtered by selected artist in song form
  const albumsForArtist = albums.filter(
    (a) => a.artist_id === songForm.artistId
  );

  // Upload file and get URL
  const uploadAudio = async (file: File): Promise<string | null> => {
    setUploadProgress("uploading");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/songs/upload", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      setUploadProgress("error");
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка загрузкі файла");
      return null;
    }
    setUploadProgress("done");
    const { url } = await res.json();
    return url as string;
  };

  const saveSong = async () => {
    if (!songForm.title || !songForm.artistId) {
      setError("Патрабуецца назва і артыст");
      return;
    }
    setSaving(true);
    setError(null);

    let audioUrl = songForm.audioUrl || null;

    if (uploadFile) {
      const url = await uploadAudio(uploadFile);
      if (!url) {
        setSaving(false);
        return;
      }
      audioUrl = url;
    }

    const res = await fetch("/api/admin/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: songForm.id || undefined,
        artistId: songForm.artistId,
        albumId: songForm.albumId || null,
        title: songForm.title,
        audioUrl,
        externalUrl: songForm.externalUrl || null,
        coverUrl: songForm.coverUrl || null,
        durationSec: songForm.durationSec ? Number(songForm.durationSec) : null,
        trackNumber: songForm.trackNumber ? Number(songForm.trackNumber) : null,
        sortOrder: Number(songForm.sortOrder),
        isPublished: songForm.isPublished,
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка захавання");
    } else {
      setSongForm(emptySongForm);
      setUploadFile(null);
      setUploadProgress("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadAll();
    }
    setSaving(false);
  };

  const deleteSong = async (id: string) => {
    if (!confirm("Выдаліць песню?")) return;
    setDeleting(id);
    await fetch(`/api/admin/songs/${id}`, { method: "DELETE" });
    setDeleting(null);
    await loadAll();
  };

  const editSong = (song: Song) => {
    setSongForm({
      id: song.id,
      artistId: song.artist_id,
      albumId: song.album_id ?? "",
      title: song.title,
      audioUrl: song.audio_url ?? "",
      externalUrl: song.external_url ?? "",
      coverUrl: song.cover_url ?? "",
      durationSec: song.duration_sec?.toString() ?? "",
      trackNumber: song.track_number?.toString() ?? "",
      sortOrder: song.sort_order,
      isPublished: song.is_published,
    });
    setUploadFile(null);
    setUploadProgress("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTab("songs");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveAlbum = async () => {
    if (!albumForm.title || !albumForm.artistId) {
      setError("Патрабуецца назва і артыст");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: albumForm.id || undefined,
        artistId: albumForm.artistId,
        title: albumForm.title,
        coverUrl: albumForm.coverUrl || null,
        releaseDate: albumForm.releaseDate || null,
        description: albumForm.description || null,
        isPublished: albumForm.isPublished,
        sortOrder: Number(albumForm.sortOrder),
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка захавання");
    } else {
      setAlbumForm(emptyAlbumForm);
      await loadAll();
    }
    setSaving(false);
  };

  const deleteAlbum = async (id: string) => {
    if (!confirm("Выдаліць альбом? Усе песні будуць адвязаны.")) return;
    setDeleting(id);
    await fetch(`/api/admin/albums/${id}`, { method: "DELETE" });
    setDeleting(null);
    await loadAll();
  };

  const editAlbum = (album: Album) => {
    setAlbumForm({
      id: album.id,
      artistId: album.artist_id,
      title: album.title,
      coverUrl: album.cover_url ?? "",
      releaseDate: album.release_date ?? "",
      description: album.description ?? "",
      isPublished: album.is_published,
      sortOrder: album.sort_order,
    });
    setTab("albums");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inputCls = "px-3 py-2 rounded-lg bg-muted border border-border text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "text-xs text-muted-foreground mb-1 block";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Песні</h1>
        <p className="text-sm text-muted-foreground">Загрузка MP3, альбомы, сувязь з артыстамі.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setTab("songs"); setError(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "songs" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:text-foreground"}`}
        >
          <Music className="w-4 h-4" /> Песні
        </button>
        <button
          onClick={() => { setTab("albums"); setError(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "albums" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:text-foreground"}`}
        >
          <Disc className="w-4 h-4" /> Альбомы
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ─────────────── SONGS TAB ─────────────── */}
      {tab === "songs" && (
        <>
          {/* Song form */}
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold">
              {songForm.id ? "Рэдагаваць песню" : "Дадаць песню"}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Артыст *</label>
                <select
                  className={inputCls}
                  value={songForm.artistId}
                  onChange={(e) => setSongForm({ ...songForm, artistId: e.target.value, albumId: "" })}
                >
                  <option value="">— выбраць —</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Альбом (неабавязкова)</label>
                <select
                  className={inputCls}
                  value={songForm.albumId}
                  onChange={(e) => setSongForm({ ...songForm, albumId: e.target.value })}
                  disabled={!songForm.artistId}
                >
                  <option value="">— без альбома —</option>
                  {albumsForArtist.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Назва *</label>
                <input
                  className={inputCls}
                  placeholder="Назва песні"
                  value={songForm.title}
                  onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
                />
              </div>

              {/* Audio file upload */}
              <div className="md:col-span-2">
                <label className={labelCls}>MP3-файл</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-dashed border-border bg-muted hover:border-primary text-sm text-foreground/70 hover:text-foreground transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploadFile ? uploadFile.name : "Выбраць файл"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,.mp3,.wav,.ogg"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setUploadFile(f);
                        setUploadProgress("idle");
                      }}
                    />
                  </label>
                  {uploadProgress === "uploading" && (
                    <span className="text-xs text-muted-foreground animate-pulse">Загрузка...</span>
                  )}
                  {uploadProgress === "done" && (
                    <span className="flex items-center gap-1 text-xs text-green-500"><Check className="w-3 h-3" /> Загружана</span>
                  )}
                  {uploadProgress === "error" && (
                    <span className="text-xs text-destructive">Памылка</span>
                  )}
                  {uploadFile && (
                    <button
                      onClick={() => { setUploadFile(null); setUploadProgress("idle"); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {songForm.audioUrl && !uploadFile && (
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    Бягучы файл: <a href={songForm.audioUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{songForm.audioUrl}</a>
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Знешні URL (апцыянальна)</label>
                <input
                  className={inputCls}
                  placeholder="https://soundcloud.com/..."
                  value={songForm.externalUrl}
                  onChange={(e) => setSongForm({ ...songForm, externalUrl: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>URL вокладкі</label>
                <input
                  className={inputCls}
                  placeholder="https://..."
                  value={songForm.coverUrl}
                  onChange={(e) => setSongForm({ ...songForm, coverUrl: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Нумар трэка</label>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  placeholder="1"
                  value={songForm.trackNumber}
                  onChange={(e) => setSongForm({ ...songForm, trackNumber: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Доўгасць (сек)</label>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  placeholder="180"
                  value={songForm.durationSec}
                  onChange={(e) => setSongForm({ ...songForm, durationSec: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Парадак сартавання</label>
                <input
                  className={inputCls}
                  type="number"
                  value={songForm.sortOrder}
                  onChange={(e) => setSongForm({ ...songForm, sortOrder: Number(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="song-published"
                  type="checkbox"
                  checked={songForm.isPublished}
                  onChange={(e) => setSongForm({ ...songForm, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="song-published" className="text-sm">Апублікаваць</label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveSong}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
              >
                {saving ? "Захаванне..." : songForm.id ? "Абнавіць" : "Дадаць"}
              </button>
              {songForm.id && (
                <button
                  onClick={() => { setSongForm(emptySongForm); setUploadFile(null); setUploadProgress("idle"); }}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-foreground/70 hover:text-foreground"
                >
                  Скасаваць
                </button>
              )}
            </div>
          </div>

          {/* Songs list */}
          <div className="glass rounded-2xl border border-border p-6">
            <h2 className="text-sm font-semibold mb-4">Спіс песень ({songs.length})</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            ) : songs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Песні не знойдзены</p>
            ) : (
              <div className="space-y-2">
                {songs.map((song) => (
                  <div key={song.id} className="rounded-lg border border-border p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {song.artists?.name ?? "—"}
                        {song.albums ? ` · ${song.albums.title}` : ""}
                        {song.duration_sec ? ` · ${formatDuration(song.duration_sec)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {song.audio_url && (
                        <a
                          href={song.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Прайграць"
                          className="text-xs px-2 py-1 rounded bg-muted border border-border hover:border-primary transition-colors"
                        >
                          ▶
                        </a>
                      )}
                      <span className={`text-xs px-2 py-1 rounded border ${song.is_published ? "border-green-500/30 text-green-600 bg-green-500/10" : "border-border text-muted-foreground bg-muted"}`}>
                        {song.is_published ? "✓" : "черновик"}
                      </span>
                      <button
                        onClick={() => editSong(song)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Рэдагаваць"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSong(song.id)}
                        disabled={deleting === song.id}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                        title="Выдаліць"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─────────────── ALBUMS TAB ─────────────── */}
      {tab === "albums" && (
        <>
          {/* Album form */}
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold">
              {albumForm.id ? "Рэдагаваць альбом" : "Дадаць альбом"}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Артыст *</label>
                <select
                  className={inputCls}
                  value={albumForm.artistId}
                  onChange={(e) => setAlbumForm({ ...albumForm, artistId: e.target.value })}
                >
                  <option value="">— выбраць —</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Назва *</label>
                <input
                  className={inputCls}
                  placeholder="Назва альбома"
                  value={albumForm.title}
                  onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Дата выхаду</label>
                <input
                  className={inputCls}
                  type="date"
                  value={albumForm.releaseDate}
                  onChange={(e) => setAlbumForm({ ...albumForm, releaseDate: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>URL вокладкі</label>
                <input
                  className={inputCls}
                  placeholder="https://..."
                  value={albumForm.coverUrl}
                  onChange={(e) => setAlbumForm({ ...albumForm, coverUrl: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Апісанне</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Апісанне альбома..."
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Парадак сартавання</label>
                <input
                  className={inputCls}
                  type="number"
                  value={albumForm.sortOrder}
                  onChange={(e) => setAlbumForm({ ...albumForm, sortOrder: Number(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="album-published"
                  type="checkbox"
                  checked={albumForm.isPublished}
                  onChange={(e) => setAlbumForm({ ...albumForm, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="album-published" className="text-sm">Апублікаваць</label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveAlbum}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
              >
                {saving ? "Захаванне..." : albumForm.id ? "Абнавіць" : "Дадаць"}
              </button>
              {albumForm.id && (
                <button
                  onClick={() => setAlbumForm(emptyAlbumForm)}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-foreground/70 hover:text-foreground"
                >
                  Скасаваць
                </button>
              )}
            </div>
          </div>

          {/* Albums list */}
          <div className="glass rounded-2xl border border-border p-6">
            <h2 className="text-sm font-semibold mb-4">Спіс альбомаў ({albums.length})</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            ) : albums.length === 0 ? (
              <p className="text-sm text-muted-foreground">Альбомы не знойдзены</p>
            ) : (
              <div className="space-y-2">
                {albums.map((album) => {
                  const trackCount = songs.filter((s) => s.album_id === album.id).length;
                  return (
                    <div key={album.id} className="rounded-lg border border-border p-3 flex items-center gap-3">
                      {album.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={album.cover_url} alt={album.title} className="w-10 h-10 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                          <Disc className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{album.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {album.artists?.name ?? "—"}
                          {album.release_date ? ` · ${album.release_date}` : ""}
                          {` · ${trackCount} тр.`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-1 rounded border ${album.is_published ? "border-green-500/30 text-green-600 bg-green-500/10" : "border-border text-muted-foreground bg-muted"}`}>
                          {album.is_published ? "апубл." : "чарнавік"}
                        </span>
                        <button
                          onClick={() => editAlbum(album)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Рэдагаваць"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteAlbum(album.id)}
                          disabled={deleting === album.id}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                          title="Выдаліць"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
