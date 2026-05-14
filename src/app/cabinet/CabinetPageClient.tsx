"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
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
  Disc3,
  Settings,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile, type SpeuProfile } from "@/lib/supabase/speu";
import { snapshotToDisplayUser, type CabinetUserSnapshot } from "./cabinet-user-snapshot";
import { CabinetUiAccentPicker } from "./CabinetUiAccentPicker";
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
      wrapper: "bg-primary/10 border border-primary/30 text-primary",
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

function SignupTabFromUrl({
  onSignupTab,
}: {
  onSignupTab: () => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("tab") === "signup") {
      onSignupTab();
    }
  }, [searchParams, onSignupTab]);

  return null;
}

export type CabinetPageClientProps = {
  initialUser: CabinetUserSnapshot | null;
  initialProfile: SpeuProfile | null;
};

export function CabinetPageClient({ initialUser, initialProfile }: CabinetPageClientProps) {
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<Mode>("signin");
  const [authPanel, setAuthPanel] = useState<"credentials" | "forgot">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Msg | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(() =>
    initialUser ? snapshotToDisplayUser(initialUser) : null,
  );
  const [isAdmin, setIsAdmin] = useState(() => Boolean(initialProfile?.is_admin));
  const [isArtist, setIsArtist] = useState(() => Boolean(initialProfile?.is_artist));
  const [showAllSitePages, setShowAllSitePages] = useState(() =>
    Boolean(initialProfile?.admin_show_all_pages),
  );
  const [savingShowAll, setSavingShowAll] = useState(false);

  const lastUserIdRef = useRef<string | null>(initialUser?.id ?? null);

  const syncUser = async (u: SupabaseUser | null) => {
    if (!u) {
      lastUserIdRef.current = null;
      setUser(null);
      setIsAdmin(false);
      setIsArtist(false);
      setShowAllSitePages(false);
      return;
    }

    const switchedAccount = lastUserIdRef.current !== u.id;
    lastUserIdRef.current = u.id;
    setUser(u);

    if (switchedAccount) {
      setIsAdmin(false);
      setIsArtist(false);
      setShowAllSitePages(false);
    }

    try {
      const profile = await getSpeuProfile(supabase, u.id);
      setIsAdmin(Boolean(profile?.is_admin));
      setIsArtist(Boolean(profile?.is_artist));
      setShowAllSitePages(Boolean(profile?.admin_show_all_pages));
    } catch {
      if (switchedAccount) {
        setIsAdmin(false);
        setIsArtist(false);
        setShowAllSitePages(false);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const resetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const redirectTo = `${window.location.origin}/auth/recovery`;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetErr) {
        setMessage({ text: resetErr.message, kind: "error" });
      } else {
        setMessage({
          text: "Еслі адрас сапраўдны — ліст з спасылкай прыйдзе на пошту. Праверце скрыню і каталог spam.",
          kind: "info",
        });
        setAuthPanel("credentials");
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Памылка", kind: "error" });
    }
    setLoading(false);
  };

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

  const signOut = () => {
    window.location.assign("/api/auth/signout");
  };

  const openSignupFromUrl = useCallback(() => {
    setAuthPanel("credentials");
    setMode("signup");
    setMessage(null);
  }, []);

  const isAuthed = Boolean(user);

  if (!isAuthed) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-sm glass rounded-2xl border border-border p-8">
          <Suspense>
            <OAuthErrorReader onError={setMessage} />
            <SignupTabFromUrl onSignupTab={openSignupFromUrl} />
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

          {authPanel === "forgot" ? (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setAuthPanel("credentials");
                  setMessage(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Назад да ўваходу
              </button>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground italic">
                  Аднаўленне пароля
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Увядзіце email акаўнта — мы дашлём спасылку. У кансолі Supabase дадайце redirect URL вашага сайту з шляхам{" "}
                  <span className="font-mono text-muted-foreground/80">/auth/recovery</span>.
                </p>
              </div>
              <form onSubmit={resetPasswordSubmit} className="space-y-4" autoComplete="on">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Адрас эл. пошты"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/45 outline-none focus:border-primary/40 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  {loading ? "Адпраўляецца…" : "Даслаць спасылку"}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex glass rounded-xl p-1 border border-border mb-6">
                {(["signin", "signup"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setAuthPanel("credentials");
                      setMode(tab);
                      setMessage(null);
                    }}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      mode === tab
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
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

              <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
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
                    name="password"
                    required
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
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

                {mode === "signin" && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthPanel("forgot");
                        setMessage(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                    >
                      Забылі пароль?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" />
                  {loading
                    ? "Загружаецца…"
                    : mode === "signin"
                      ? "Увайсці"
                      : "Стварыць акаўнт"}
                </button>
              </form>
            </>
          )}
          {message && <MessageBanner msg={message} />}
        </div>
      </div>
    );
  }

  const toggleShowAllSitePages = async () => {
    if (!isAdmin || savingShowAll) return;
    const next = !showAllSitePages;
    setSavingShowAll(true);
    setMessage(null);
    const res = await fetch("/api/user/player-prefs", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_show_all_pages: next }),
    });
    setSavingShowAll(false);
    if (!res.ok) {
      setMessage({ text: "Не ўдалося захаваць налады", kind: "error" });
      return;
    }
    setShowAllSitePages(next);
  };

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Карыстальнік";

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="glass rounded-2xl border border-border p-6 sm:p-8">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
              )}
              {isAdmin && (
                <div
                  className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                  title="Адміністратар"
                >
                  <Shield className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="font-display text-2xl font-semibold text-foreground italic truncate">
                {displayName}
              </h1>
              {user?.email && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{user.email}</p>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                  <Shield className="h-3 w-3" />
                  Адміністратар
                </span>
              )}
            </div>

            <div className="shrink-0 pt-0.5">
              <Menu.Root modal={false}>
                <Menu.Trigger
                  type="button"
                  aria-label="Налады"
                  className={cn(
                    "rounded-xl border border-border p-2.5 text-muted-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
                  )}
                >
                  <Settings className="h-5 w-5" strokeWidth={1.75} />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={8} align="end" className="z-50">
                    <Menu.Popup className="min-w-[12rem] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
                      <Menu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none select-none data-highlighted:bg-muted"
                        onClick={signOut}
                      >
                        <LogOut className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} />
                        Выйсці
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>
          </div>

          {message && (
            <div className="mt-5">
              <MessageBanner msg={message} />
            </div>
          )}
        </div>

        <CabinetUiAccentPicker />

        {isAdmin && (
          <div className="glass rounded-2xl border border-border p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" strokeWidth={1.75} />
                Паказваць усе старонкі ў меню
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Уключайце, каб у навігацыі адлюстроўваліся ўсе раздзелы (уключна схаваныя для публікі). Каб адкрываць
                схаваныя URL без рэдырэкту на галоўную, таксама патрэбная гэтая опцыя.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showAllSitePages}
              disabled={savingShowAll}
              onClick={() => void toggleShowAllSitePages()}
              className={`relative w-11 h-6 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 ${
                showAllSitePages ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                  showAllSitePages ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {isArtist && (
          <Link
            href="/cabinet/artist"
            className="group flex items-center gap-4 glass rounded-2xl border border-primary/25 p-6 hover:border-primary/45 hover:bg-primary/5 transition-all duration-200"
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Disc3 className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Кабінет артыста</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Загрузка сінглаў і альбомаў, статусы заявак на публікацыю
              </p>
            </div>
            <span className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors text-lg">→</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/admin"
            className="group flex items-center gap-4 glass rounded-2xl border border-primary/25 p-6 hover:border-primary/50 hover:bg-primary/4 transition-all duration-200"
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Shield className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Панэль адміністратара</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Кіраванне кантэнтам, артыстамі, узроўнямі падтрымкі і заяўкамі
              </p>
            </div>
            <span className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors text-lg">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
