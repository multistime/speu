"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, Mail, Lock, Globe, User, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function CabinetPage() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsAuthed(Boolean(user));
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const profile = await getSpeuProfile(supabase, user.id);
        setIsAdmin(Boolean(profile?.is_admin));
      } catch {
        setIsAdmin(false);
      }
    };

    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      setIsAuthed(Boolean(user));
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const profile = await getSpeuProfile(supabase, user.id);
        setIsAdmin(Boolean(profile?.is_admin));
      } catch {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const action =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (action.error) {
      setMessage(action.error.message);
    } else if (mode === "signup") {
      setMessage("Акаўнт створаны. Праверце пошту для пацверджання.");
    } else {
      setMessage("Уваход выкананы.");
    }

    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/cabinet`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      setMessage("Не атрымалася адкрыць уваход праз Google. Праверце налады Supabase і перазагрузіце старонку.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Памылка ўваходу праз Google");
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMessage("Вы выйшлі з акаўнта.");
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-sm glass rounded-2xl border border-border p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/8 border border-primary/20 mb-4">
              <User className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-1 italic">
              Асабісты кабінет
            </h2>
          </div>

          <div className="flex glass rounded-xl p-1 border border-border mb-6">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  mode === tab
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "signin" ? "Увайсці" : "Зарэгістравацца"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-border bg-muted/40 text-muted-foreground text-sm font-medium hover:border-primary/25 hover:text-foreground hover:bg-muted transition-all duration-200 mb-4 disabled:opacity-60"
          >
            <Globe className="h-4 w-4" />
            Працягнуць праз Google
          </button>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Адрас эл. пошты"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/45 outline-none focus:border-primary/40 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/45 outline-none focus:border-primary/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading
                ? "Загрузка..."
                : mode === "signin"
                ? "Увайсці"
                : "Стварыць акаўнт"}
            </button>
          </form>

          {message && <p className="mt-4 text-xs text-muted-foreground">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto glass rounded-2xl border border-border p-8">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-2 italic">
          Мой кабінет
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Вы ўвайшлі ў сістэму. Профіль SPEU падключаны праз Supabase.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-primary/30 text-primary font-medium hover:bg-primary/8 transition-all"
            >
              <Shield className="h-4 w-4" />
              Перайсці ў адмінку
            </Link>
          )}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-foreground/80 font-medium hover:bg-muted transition-all"
          >
            <LogOut className="h-4 w-4" />
            Выйсці
          </button>
        </div>

        {message && <p className="mt-4 text-xs text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
