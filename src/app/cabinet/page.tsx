"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LogIn,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";
type MessageKind = "error" | "success" | "info";

interface Msg {
  text: string;
  kind: MessageKind;
}

const AUTH_ERROR_MAP: Record<string, string> = {
  auth_callback_error: "Памылка аўтарызацыі. Паспрабуйце яшчэ раз.",
  access_denied: "Доступ адмоўлены. Праверце дазволы і паспрабуйце яшчэ раз.",
  invalid_credentials: "Няправільны email або пароль.",
  email_not_confirmed: "Email не пацверджаны. Праверце паштовую скрыню.",
  over_email_send_rate_limit: "Зашмат спроб. Паспрабуйце праз хвіліну.",
};

function parseAuthError(code: string): string {
  return AUTH_ERROR_MAP[code] ?? `Памылка: ${code}`;
}

function MessageBanner({ msg }: { msg: Msg }) {
  const styles: Record<MessageKind, { wrapper: string; icon: React.ReactNode }> = {
    error: {
      wrapper: "bg-destructive/10 border border-destructive/30 text-destructive",
      icon: <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />,
    },
    success: {
      wrapper: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400",
      icon: <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />,
    },
    info: {
      wrapper: "bg-primary/10 border border-primary/30 text-primary",
      icon: <Info className="h-4 w-4 shrink-0 mt-0.5" />,
    },
  };
  const s = styles[msg.kind];
  return (
    <div className={cn("mt-4 flex gap-2.5 rounded-xl p-3.5 text-sm leading-snug", s.wrapper)}>
      {s.icon}
      <span>{msg.text}</span>
    </div>
  );
}

/** Reads error params from URL and calls onError when found. Must be wrapped in Suspense. */
function OAuthErrorReader({ onError }: { onError: (msg: Msg) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get("error") ?? searchParams.get("error_code");
    if (!errorCode) return;
    const description = searchParams.get("error_description");
    const text = description
      ? decodeURIComponent(description.replace(/\+/g, " "))
      : parseAuthError(errorCode);
    onError({ text, kind: "error" });
  }, [searchParams, onError]);

  return null;
}

export default function CabinetPage() {
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Msg | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthed(Boolean(user));
      if (!user) { setIsAdmin(false); return; }
      try {
        const profile = await getSpeuProfile(supabase, user.id);
        setIsAdmin(Boolean(profile?.is_admin));
      } catch { setIsAdmin(false); }
    };

    void refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      setIsAuthed(Boolean(user));
      if (!user) { setIsAdmin(false); return; }
      try {
        const profile = await getSpeuProfile(supabase, user.id);
        setIsAdmin(Boolean(profile?.is_admin));
      } catch { setIsAdmin(false); }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const text =
          error.code === "email_not_confirmed"
            ? "Email не пацверджаны. Праверце паштовую скрыню і перайдзіце па спасылцы актывацыі."
            : error.code === "invalid_credentials"
            ? "Няправільны email або пароль."
            : error.message;
        setMessage({ text, kind: "error" });
      } else {
        setMessage({ text: "Уваход выкананы. Вітаем!", kind: "success" });
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ text: error.message, kind: "error" });
      } else {
        setMessage({
          text: "Акаўнт створаны! Праверце паштовую скрыню і перайдзіце па спасылцы для актывацыі акаўнта.",
          kind: "info",
        });
      }
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
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) {
        setMessage({ text: error.message, kind: "error" });
        setLoading(false);
        return;
      }
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      setMessage({
        text: "Не атрымалася адкрыць Google. Праверце налады Supabase.",
        kind: "error",
      });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Памылка Google", kind: "error" });
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMessage({ text: "Вы выйшлі з акаўнта.", kind: "info" });
  };

  if (isAuthed === null) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-sm glass rounded-2xl border border-border p-8">
          {/* Read OAuth error from URL */}
          <Suspense>
            <OAuthErrorReader onError={setMessage} />
          </Suspense>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/8 border border-primary/20 mb-4">
              <User className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-1 italic">
              Асабісты кабінет
            </h2>
            <p className="text-sm text-muted-foreground">
              Увайдзіце, каб атрымаць доступ да захаваных тэкстаў і трэкаў
            </p>
          </div>

          <div className="flex glass rounded-xl p-1 border border-border mb-6">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setMessage(null); }}
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

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">або</span>
            <div className="flex-1 h-px bg-border" />
          </div>

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
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/45 outline-none focus:border-primary/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                aria-label={showPassword ? "Схаваць пароль" : "Паказаць пароль"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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

          {message && <MessageBanner msg={message} />}
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

        {message && (
          <div className="mt-6">
            <MessageBanner msg={message} />
          </div>
        )}
      </div>
    </div>
  );
}
