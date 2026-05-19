"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSpeuMobileChrome } from "@/contexts/SpeuMobileChromeContext";
import { MobileBottomStack } from "@/components/MobileBottomStack";

type MobileMainFrameProps = {
  logoHref: string;
  children: ReactNode;
};

export function MobileMainFrame({ logoHref, children }: MobileMainFrameProps) {
  const { showBottomNav } = useSpeuMobileChrome();

  return (
    <>
      <main
        className={cn(
          "min-w-0 max-w-full overflow-x-hidden pt-[calc(var(--speu-site-header,5.5rem)+0.5rem)]",
          showBottomNav && "pb-[var(--speu-mobile-bottom-stack)]",
        )}
      >
        {children}
      </main>
      <MobileBottomStack logoHref={logoHref} />
    </>
  );
}
