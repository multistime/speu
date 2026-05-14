"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type SpeuMobileChromeValue = {
  showBottomNav: boolean;
  narrowViewport: boolean;
};

const SpeuMobileChromeContext = createContext<SpeuMobileChromeValue>({
  showBottomNav: false,
  narrowViewport: false,
});

export function SpeuMobileChromeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [narrowViewport, setNarrowViewport] = useState(false);
  const [standaloneDisplay, setStandaloneDisplay] = useState(false);

  useLayoutEffect(() => {
    const mqNarrow = window.matchMedia("(max-width: 767px)");
    const mqStandalone = window.matchMedia("(display-mode: standalone)");

    const sync = () => {
      setNarrowViewport(mqNarrow.matches);
      setStandaloneDisplay(
        mqStandalone.matches ||
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    };

    sync();
    mqNarrow.addEventListener("change", sync);
    mqStandalone.addEventListener("change", sync);
    return () => {
      mqNarrow.removeEventListener("change", sync);
      mqStandalone.removeEventListener("change", sync);
    };
  }, []);

  useLayoutEffect(() => {
    const isSpeuMobilePwa = standaloneDisplay && narrowViewport;

    if (isSpeuMobilePwa) {
      document.documentElement.classList.add("speu-pwa-mobile");
      document.body.classList.add("speu-pwa-mobile");
    } else {
      document.documentElement.classList.remove("speu-pwa-mobile");
      document.body.classList.remove("speu-pwa-mobile");
    }

    return () => {
      document.documentElement.classList.remove("speu-pwa-mobile");
      document.body.classList.remove("speu-pwa-mobile");
    };
  }, [standaloneDisplay, narrowViewport]);

  useEffect(() => {
    if (!(standaloneDisplay && narrowViewport)) {
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* ignore */
      }
      return;
    }

    const tryLockPortrait = () => {
      try {
        const o = screen.orientation as ScreenOrientation & {
          lock?: (orientation: string) => Promise<void>;
        };
        if (o?.lock) {
          void o.lock("portrait").catch(() => {});
        }
      } catch {
        /* ignore */
      }
    };

    tryLockPortrait();
    document.addEventListener("pointerdown", tryLockPortrait, { passive: true, capture: true });
    return () => {
      document.removeEventListener("pointerdown", tryLockPortrait, true);
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* ignore */
      }
    };
  }, [standaloneDisplay, narrowViewport]);

  const showBottomNav = useMemo(() => {
    if (pathname.startsWith("/admin")) return false;
    return narrowViewport || standaloneDisplay;
  }, [pathname, narrowViewport, standaloneDisplay]);

  useLayoutEffect(() => {
    if (showBottomNav) document.body.classList.add("speu-bottom-nav-active");
    else document.body.classList.remove("speu-bottom-nav-active");
    return () => document.body.classList.remove("speu-bottom-nav-active");
  }, [showBottomNav]);

  const value = useMemo(
    () => ({ showBottomNav, narrowViewport }),
    [showBottomNav, narrowViewport],
  );

  return (
    <SpeuMobileChromeContext.Provider value={value}>{children}</SpeuMobileChromeContext.Provider>
  );
}

export function useSpeuMobileChrome() {
  return useContext(SpeuMobileChromeContext);
}
