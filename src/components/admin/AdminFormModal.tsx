"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type AdminFormModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Напрыклад max-w-3xl для доўгіх форм */
  maxWidthClassName?: string;
};

export function AdminFormModal({
  open,
  onClose,
  children,
  maxWidthClassName = "max-w-2xl",
}: AdminFormModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="admin-form-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto bg-background/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className={`relative w-full ${maxWidthClassName} my-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative glass rounded-2xl border border-border shadow-2xl max-h-[min(90vh,calc(100dvh-2rem))] overflow-y-auto overflow-x-hidden">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-background/40 backdrop-blur-sm border border-border/50 text-foreground/60 hover:text-foreground transition-colors"
                aria-label="Зачыніць"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <div className="p-6 pr-14 space-y-4">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
