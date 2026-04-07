import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  className?: string;
  /** Аватар або іконка злева ад тэксту + стрэлкі */
  leading?: ReactNode;
  children: ReactNode;
};

/**
 * Тэкставая ўнутраная спасылка хаба са стрэлкай уверх-управа (як знешняя, але ўнутры Спеў).
 */
export function SpeuInlineNavLink({ className, leading, children, ...props }: Props) {
  return (
    <Link
      className={cn(
        "group inline-flex max-w-full min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-primary",
        className
      )}
      {...props}
    >
      {leading}
      <span className="inline-flex min-w-0 items-center gap-1">
        <span className="min-w-0 truncate">{children}</span>
        <ArrowUpRight
          strokeWidth={2}
          className="size-3 shrink-0 text-muted-foreground/45 transition-colors group-hover:text-primary/90"
          aria-hidden
        />
      </span>
    </Link>
  );
}

export function SpeuMicroNavArrow({ className }: { className?: string }) {
  return (
    <ArrowUpRight
      strokeWidth={2}
      className={cn("size-2.5 shrink-0 text-muted-foreground/40", className)}
      aria-hidden
    />
  );
}
