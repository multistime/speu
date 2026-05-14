"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, FormEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function RecoveryForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const ping = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setHasSession(true);
        setChecking(false);
        return;
      }
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 250));
        const next = await supabase.auth.getSession();
        if (cancelled) return;
        if (next.data.session) {
          setHasSession(true);
          setChecking(false);
          return;
        }
      }
      setChecking(false);
    };

    void ping();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session
      ) {
        setHasSession(true);
        setChecking(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("Пароль павінен змяшчаць не менш за 8 сімвалаў.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.replace("/cabinet");
  };

  if (checking) {
    return (
      <p className="text-sm text-muted-foreground text-center animate-pulse">Праверка спасылкі…</p>
    );
  }

  if (!hasSession) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Спасылка састарэла або недасяжная. Запытайце новы ліст з кабінета ўваходу.
        </p>
        <Link
          href="/cabinet"
          className="inline-flex text-sm font-medium text-primary hover:underline underline-offset-2"
        >
          Вярнуцца да ўваходу
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 w-full">
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Новы пароль"
          className="w-full pl-10 pr-11 py-3 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/45 outline-none focus:border-primary/40 transition-all"
        />
        <button
          type="button"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? "Схаваць пароль" : "Паказаць пароль"}
        >
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {errorMsg && (
        <p className="text-sm text-destructive border border-destructive/25 rounded-lg px-3 py-2">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full py-3.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground",
          "hover:opacity-90 disabled:opacity-60 transition-opacity",
        )}
      >
        {loading ? "Захоўваецца…" : "Захаваць новы пароль"}
      </button>
    </form>
  );
}

export default function AuthRecoveryPage() {
  return (
    <div className="min-h-screen pt-28 pb-28 px-4 flex items-center justify-center">
      <div className="w-full max-w-sm glass rounded-2xl border border-border p-8">
        <h1 className="font-display text-xl font-semibold text-foreground mb-2 italic text-center">
          Новы пароль
        </h1>
        <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
          Увядзіце новы пароль для акаўнта. Пасля захавання вы зможаце ўвайсці звычайнай формай.
        </p>
        <Suspense fallback={<p className="text-sm text-muted-foreground text-center">Загрузка…</p>}>
          <RecoveryForm />
        </Suspense>
      </div>
    </div>
  );
}
