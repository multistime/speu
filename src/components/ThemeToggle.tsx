"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// useSyncExternalStore — React 18+ way to subscribe to external DOM state.
// Avoids useEffect + setState pattern that triggers cascading renders.

function subscribeToClassChanges(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getDarkModeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return true; // SSR default: dark
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribeToClassChanges,
    getDarkModeSnapshot,
    getServerSnapshot
  );

  const toggle = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("speu-theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("speu-theme", "dark");
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Светлая тэма" : "Цёмная тэма"}
      suppressHydrationWarning
      className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
        "text-foreground/45 hover:text-foreground hover:bg-muted",
        "border border-transparent hover:border-border"
      )}
    >
      {isDark
        ? <Sun  className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  );
}
