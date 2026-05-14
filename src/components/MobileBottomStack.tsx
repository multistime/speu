"use client";

import { useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useMobileDockSlot } from "@/contexts/MobileDockSlotContext";
import { useSpeuMobileChrome } from "@/contexts/SpeuMobileChromeContext";
import { SpeuBottomNavBar } from "@/components/SpeuBottomNav";

type MobileBottomStackProps = {
  logoHref: string;
};

/**
 * Адзін «каранёвы» fixed-стэк унізе: слот дак-плэера (партал) + таб-бар.
 * Вышыня стэка → `--speu-mobile-bottom-stack` для main / шторкі / футэра.
 */
export function MobileBottomStack({ logoHref }: MobileBottomStackProps) {
  const { showBottomNav } = useSpeuMobileChrome();
  const dockCtx = useMobileDockSlot();
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

  if (!showBottomNav || !dockCtx) return null;

  return (
    <div ref={stackRef} className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col md:hidden">
      <div
        ref={(el) => {
          flushSync(() => {
            dockCtx.setDockSlotEl(el);
          });
        }}
        className="min-h-0 w-full shrink-0"
      />
      <SpeuBottomNavBar logoHref={logoHref} />
    </div>
  );
}
