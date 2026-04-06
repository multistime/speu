"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ImageIcon, Link2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ADMIN_IMAGE_ACCEPT,
  ADMIN_IMAGE_MAX_BYTES,
  isLikelyImageUrl,
  uploadAdminImageFile,
} from "@/lib/admin/image-upload";

type ImageFolder = "artists" | "albums" | "tracks";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  storageFolder: ImageFolder;
  previewShape?: "square" | "circle";
  description?: string;
};

const inputCls =
  "px-3 py-2 rounded-lg bg-muted border border-border text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary";

export function AdminImageSourceField({
  label,
  value,
  onChange,
  storageFolder,
  previewShape = "square",
  description,
}: Props) {
  const uid = useId();
  const liveId = `${uid}-live`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const mb = ADMIN_IMAGE_MAX_BYTES / 1024 / 1024;

  const runUpload = useCallback(
    async (file: File) => {
      setLocalError(null);
      setUploading(true);
      const supabase = createClient();
      const res = await uploadAdminImageFile(supabase, file, storageFolder);
      setUploading(false);
      if (!res.ok) {
        setLocalError(res.message);
        return;
      }
      onChange(res.publicUrl);
    },
    [onChange, storageFolder]
  );

  const onPickFile = (file: File | null | undefined) => {
    if (!file) return;
    void runUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    onPickFile(f);
  };

  const previewWrap =
    previewShape === "circle"
      ? "w-24 h-24 rounded-full overflow-hidden border border-border bg-muted shrink-0"
      : "w-full max-w-[140px] aspect-square rounded-lg overflow-hidden border border-border bg-muted shrink-0";

  return (
    <div className="md:col-span-2 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs text-muted-foreground block">{label}</label>
        <div
          className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40"
          role="group"
          aria-label="Крыніца выявы"
        >
          <button
            type="button"
            onClick={() => {
              setMode("file");
              setLocalError(null);
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === "file" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <Upload className="w-3 h-3" aria-hidden />
              Файл
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("url");
              setLocalError(null);
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <Link2 className="w-3 h-3" aria-hidden />
              Спасылка
            </span>
          </button>
        </div>
      </div>

      {description && <p className="text-[11px] text-muted-foreground -mt-1">{description}</p>}

      {localError && (
        <div
          aria-live="polite"
          id={liveId}
          role="alert"
          className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2"
        >
          {localError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 w-full space-y-3">
          {mode === "file" ? (
            <>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-70" aria-hidden />
                <p className="text-sm text-foreground/80">
                  Перацягніце файл сюды або націсніце, каб абраць
                </p>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Да {mb} МБ · JPEG, PNG, WebP, GIF
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ADMIN_IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    onPickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              {uploading && (
                <p className="text-xs text-muted-foreground animate-pulse">Загружаецца ў сховішча…</p>
              )}
            </>
          ) : (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block" htmlFor={`${uid}-url`}>
                Прамая спасылка на выяву (https)
              </label>
              <input
                id={`${uid}-url`}
                className={inputCls}
                placeholder="https://…"
                value={value}
                onChange={(e) => {
                  setLocalError(null);
                  onChange(e.target.value);
                }}
                onBlur={() => {
                  if (value.trim() && !isLikelyImageUrl(value)) {
                    setLocalError("Увядзіце карэктны URL (http або https).");
                  }
                }}
                spellCheck={false}
              />
            </div>
          )}

          {value.trim() && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
                onClick={() => {
                  onChange("");
                  setLocalError(null);
                }}
              >
                Выдаліць выяву
              </button>
              {isLikelyImageUrl(value) && (
                <span className="text-xs text-muted-foreground">Выява гатовая да захавання</span>
              )}
            </div>
          )}
        </div>

        {value.trim() && isLikelyImageUrl(value) && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Перадпрагляд</span>
            <div className={previewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.trim()}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setLocalError("Не ўдалося паказаць выяву. Праверце спасылку або файл.")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
