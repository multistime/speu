"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type SpeuMobileChromeValue = {
  showBottomNav: boolean;
};

const SpeuMobileChromeContext = createContext<SpeuMobileChromeValue>({
  showBottomNav: false,
});

export function SpeuMobileChromeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [narrowViewport, setNarrowViewport] = useState(false);
  const [standaloneDisplay, setStandaloneDisplay] = useState(false);

  useEffect(() => {
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

  const showBottomNav = useMemo(() => {
    if (pathname.startsWith("/admin")) return false;
    return narrowViewport || standaloneDisplay;
  }, [pathname, narrowViewport, standaloneDisplay]);

  useEffect(() => {
    if (showBottomNav) document.body.classList.add("speu-bottom-nav-active");
    else document.body.classList.remove("speu-bottom-nav-active");
    return () => document.body.classList.remove("speu-bottom-nav-active");
  }, [showBottomNav]);

  const value = useMemo(() => ({ showBottomNav }), [showBottomNav]);

  return (
    <SpeuMobileChromeContext.Provider value={value}>{children}</SpeuMobileChromeContext.Provider>
  );
}

export function useSpeuMobileChrome() {
  return useContext(SpeuMobileChromeContext);
}
