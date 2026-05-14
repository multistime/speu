"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSpeuMobileChrome } from "@/contexts/SpeuMobileChromeContext";
import { SpeuBottomNav } from "@/components/SpeuBottomNav";

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
          showBottomNav && "pb-[var(--speu-mobile-bottom-stack)] md:pb-0",
        )}
      >
        {children}
      </main>
      <SpeuBottomNav logoHref={logoHref} />
    </>
  );
}
