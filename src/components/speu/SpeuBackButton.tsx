"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  fallbackHref?: string;
  className?: string;
  /** Тэкст для скрынтачаў; на мабільных паводзіны — гісторыя браўзера праз router.back() */
  label?: string;
};

export function SpeuBackButton({ fallbackHref = "/speu", className, label = "Назад" }: Props) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg py-1.5 text-sm text-muted-foreground transition-colors hover:text-primary",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-2",
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}
