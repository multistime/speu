"use client";

import { useLayoutEffect, useRef } from "react";
import { SpeuMiniPlayerDock } from "@/components/player/SpeuMiniPlayerDock";
import { useSpeuMobileChrome } from "@/contexts/SpeuMobileChromeContext";
import { SpeuBottomNavBar } from "@/components/SpeuBottomNav";

type MobileBottomStackProps = {
  logoHref: string;
};

/**
 * Ніжні chrome: слот міні-дака (рэндэр у межах гэтага flex) + таб-бар.
 * ResizeObserver задае `--speu-mobile-bottom-stack` без партала/GlobalPlayer-парадку.
 */
export function MobileBottomStack({ logoHref }: MobileBottomStackProps) {
  const { showBottomNav } = useSpeuMobileChrome();
  const stackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!showBottomNav) {
      document.documentElement.style.removeProperty("--speu-mobile-bottom-stack");
      return;
    }
    const el = stackRef.current;
    if (!el) return;

    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--speu-mobile-bottom-stack", `${h}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.visualViewport?.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      document.documentElement.style.removeProperty("--speu-mobile-bottom-stack");
    };
  }, [showBottomNav]);

  if (!showBottomNav) return null;

  return (
    <div ref={stackRef} className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col">
      <div className="relative z-[1] min-h-0 shrink-0">
        <SpeuMiniPlayerDock />
      </div>
      <div className="relative z-[2] shrink-0">
        <SpeuBottomNavBar logoHref={logoHref} />
      </div>
    </div>
  );
}
