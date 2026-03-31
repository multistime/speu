"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  BookOpen,
  Music2,
  Sparkles,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_SAVED: {
  id: string;
  genre: string;
  mood: string;
  topic: string;
  content: string;
  created_at: string;
}[] = [
  {
    id: "1",
    genre: "нэа-фолк",
    mood: "містычны",
    topic: "балоты",
    content:
      "[Verse]\nУ глыбіні балот, дзе сонца не бывае\nХадзіць мой продак, шлях сябе шукае\n\n[Chorus]\nБалота цягне, зямля гаворыць\nЦёмны вецер лісце ворыць",
    created_at: "2025-03-28",
  },
  {
    id: "2",
    genre: "цёмны амбіент",
    mood: "жудасны",
    topic: "старыя багі",
    content:
      "[Intro]\nЗ туману выходзіць постаць старажытная\n\n[Verse]\nПаліць агонь на ўзгорку,\nБагі старыя прасяць ахвяры",
    created_at: "2025-03-25",
  },
];

function AuthForm() {
  const [mode, setMode]       = useState<"signin" | "signup">("signin");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/8 border border-primary/20 mb-4">
          <User className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-1 italic">
          Асабісты кабінет
        </h2>
        <p className="text-muted-foreground text-sm">
          Увайдзіце, каб атрымаць доступ да захаваных тэкстаў і трэкаў
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex glass rounded-xl p-1 border border-border mb-6">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              mode === m
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "signin" ? "Увайсці" : "Зарэгістравацца"}
          </button>
        ))}
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-border bg-muted/40 text-muted-foreground text-sm font-medium hover:border-primary/25 hover:text-foreground hover:bg-muted transition-all duration-200 mb-4"
      >
        <Globe className="h-4 w-4" />
        Працягнуць праз Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground/50">або</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            type="email"
            placeholder="Адрас эл. пошты"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/45 outline-none focus:border-primary/40 transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            type={showPass ? "text" : "password"}
            placeholder="Пароль"
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/45 outline-none focus:border-primary/40 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300",
            loading
              ? "bg-muted text-muted-foreground cursor-wait"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          <LogIn className="h-4 w-4" />
          {loading
            ? "Уваход…"
            : mode === "signin"
            ? "Увайсці"
            : "Стварыць акаўнт"}
        </motion.button>
      </form>
    </div>
  );
}

function SavedLyricsCard({ item }: { item: (typeof MOCK_SAVED)[0] }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-xl border border-border p-5 hover:border-primary/22 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {[item.genre, item.mood, item.topic].map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono text-primary/65 bg-primary/8 border border-primary/15"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copy}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-primary" />
              : <Copy className="h-3.5 w-3.5" />
            }
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/8 transition-all">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed line-clamp-5">
        {item.content}
      </pre>
      <p className="text-[10px] font-mono text-muted-foreground/35 mt-3">{item.created_at}</p>
    </div>
  );
}

const DEMO_SIGNED_IN = false;

export default function CabinetPage() {
  const [activeTab, setActiveTab] = useState<"lyrics" | "tracks">("lyrics");

  if (!DEMO_SIGNED_IN) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-sm glass rounded-2xl border border-border p-8">
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground mb-1 italic">
              Мой кабінет
            </h1>
            <p className="text-muted-foreground text-sm">
              Захаваныя тэксты і музычны архіў
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/22 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Захаваныя тэксты", value: MOCK_SAVED.length, icon: BookOpen },
            { label: "Захаваныя трэкі",  value: 0,                 icon: Music2   },
            { label: "Генерацыі",        value: MOCK_SAVED.length, icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="glass rounded-xl border border-border p-4 text-center"
            >
              <Icon className="h-4 w-4 text-primary/55 mx-auto mb-2" strokeWidth={1.5} />
              <p className="font-display text-xl font-semibold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex glass rounded-xl p-1 border border-border mb-6 max-w-xs">
          {(["lyrics", "tracks"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize",
                activeTab === tab
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "lyrics" ? "Тэксты" : "Трэкі"}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "lyrics" ? (
            <motion.div
              key="lyrics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {MOCK_SAVED.map((item) => (
                <SavedLyricsCard key={item.id} item={item} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="tracks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl border border-border p-12 text-center"
            >
              <Music2 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" strokeWidth={1} />
              <p className="text-muted-foreground/45 text-sm">Пакуль няма захаваных трэкаў.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
