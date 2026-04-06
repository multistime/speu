"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type TrackLikesContextValue = {
  user: User | null;
  authReady: boolean;
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string) => void;
};

const TrackLikesContext = createContext<TrackLikesContextValue | null>(null);

export function useTrackLikes(): TrackLikesContextValue {
  const ctx = useContext(TrackLikesContext);
  if (!ctx) {
    throw new Error("useTrackLikes must be used within TrackLikesProvider");
  }
  return ctx;
}

function RegisterPromptModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLButtonElement>("button[data-autofocus]")?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-like-register-title"
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <h2 id="track-like-register-title" className="font-display text-lg font-semibold italic mb-2">
          Захаваць лайкі?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Каб ставіць лайкі трэкам, стварыце акаўнт — так мы зможам захоўваць вашы перавагі.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Пазней
          </Button>
          <Button
            type="button"
            data-autofocus
            onClick={() => {
              onClose();
              router.push("/cabinet?tab=signup");
            }}
          >
            Далучыцца
          </Button>
        </div>
      </div>
    </div>
  );
}

function LikeErrorStatus({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-[99] -translate-x-1/2 max-w-[min(90vw,20rem)] rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive"
    >
      {message}
    </div>
  );
}

export function TrackLikesProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const [registerOpen, setRegisterOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLikes = useCallback(async () => {
    const res = await fetch("/api/user/track-likes", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { likes?: string[] };
    setLikedIds(new Set(data.likes ?? []));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
      if (session?.user) void loadLikes();
      else setLikedIds(new Set());
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void loadLikes();
      else setLikedIds(new Set());
    });

    return () => subscription.unsubscribe();
  }, [loadLikes]);

  const isLiked = useCallback((trackId: string) => likedIds.has(trackId), [likedIds]);

  const toggleLike = useCallback(
    (trackId: string) => {
      if (!user) {
        setRegisterOpen(true);
        return;
      }
      if (inFlightRef.current.has(trackId)) return;

      const prev = likedIds.has(trackId);
      const next = !prev;

      setLikedIds((s) => {
        const n = new Set(s);
        if (next) n.add(trackId);
        else n.delete(trackId);
        return n;
      });

      inFlightRef.current.add(trackId);

      void (async () => {
        try {
          const res = await fetch("/api/user/track-likes", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackId, liked: next }),
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
        } catch {
          setLikedIds((s) => {
            const n = new Set(s);
            if (prev) n.add(trackId);
            else n.delete(trackId);
            return n;
          });
          setErrorMsg("Не ўдалося захаваць лайк. Паспрабуйце яшчэ раз.");
          window.setTimeout(() => setErrorMsg(null), 4000);
        } finally {
          inFlightRef.current.delete(trackId);
        }
      })();
    },
    [user, likedIds],
  );

  const value = useMemo<TrackLikesContextValue>(
    () => ({
      user,
      authReady,
      isLiked,
      toggleLike,
    }),
    [user, authReady, isLiked, toggleLike],
  );

  return (
    <TrackLikesContext.Provider value={value}>
      {children}
      <RegisterPromptModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <LikeErrorStatus message={errorMsg} />
    </TrackLikesContext.Provider>
  );
}
