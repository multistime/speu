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
          showBottomNav &&
            "pb-[calc(4.35rem+env(safe-area-inset-bottom,0px))] md:pb-0",
        )}
      >
        {children}
      </main>
      <SpeuBottomNav logoHref={logoHref} />
    </>
  );
}
