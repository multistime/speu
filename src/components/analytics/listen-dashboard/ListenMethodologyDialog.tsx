"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ListenMethodologyDialog({
  open,
  onClose,
  title = "Як лічым",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-0 shadow-xl",
        "backdrop:bg-black/50 backdrop:backdrop-blur-[2px]",
      )}
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Зачыніць"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className="max-h-[min(70vh,24rem)] overflow-y-auto px-5 py-4 text-sm text-foreground leading-relaxed space-y-3">
        <p>
          <strong>Часавы пояс дзён.</strong> Даты ў графіках — каляндарныя дні па часе Мінска (Europe/Minsk).
        </p>
        <p>
          <strong>Поўнае праслухоўванне.</strong> Сесія, у якой трэк прайграны да канца ў межах правіл анты-накруткі і
          ўліку чарта.
        </p>
        <p>
          <strong>Частковае.</strong> Пачатак прайгравання з прыблізна 15% даўжыні трэка без поўнага завяршэння
          (таксама ў межах правіл платформы).
        </p>
        <p className="text-muted-foreground text-xs">
          Унікальныя слухачы лічацца прыблізна па прыладзе / акаўнце; гэта не «унікальныя людзі» у строгім сэнсе.
        </p>
      </div>
    </dialog>
  );
}
