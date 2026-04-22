"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Music2, Sparkles, Headphones, Heart, Users, Radio, Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";

const navLinks = [
  { href: "/speu",      label: "Спеў",      icon: Disc3 },
  { href: "/generator", label: "Генератар", icon: Sparkles },
  { href: "/artists",   label: "Артысты",   icon: Users },
  { href: "/radio",     label: "Радыё Мара", icon: Radio },
  { href: "/services",  label: "Паслугі",   icon: Headphones },
  { href: "/support",   label: "Падтрымка", icon: Heart },
];

type NavbarProps = {
  visibleHrefs: string[];
};

export function Navbar({ visibleHrefs }: NavbarProps) {
  const visibleSet = new Set(visibleHrefs);
  const filteredNav = navLinks.filter((l) => visibleSet.has(l.href));
  const showCabinet = visibleSet.has("/cabinet");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const barActive = scrolled || mobileOpen;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

      const updateUserState = async () => {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        setIsAuthenticated(Boolean(user));
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

      void updateUserState();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user;
        setIsAuthenticated(Boolean(user));
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
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full min-w-0 transition-all duration-500",
        barActive
          ? "border-0 border-b border-border pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] max-md:!bg-background/95 max-md:!backdrop-blur-none max-md:!backdrop-saturate-100 md:bg-[var(--glass-bg)] md:backdrop-blur-lg md:backdrop-saturate-150"
          : "bg-transparent pb-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))]",
      )}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative">
            <Music2
              className="h-6 w-6 text-primary transition-all duration-300 group-hover:scale-110"
              strokeWidth={1.5}
            />
            <span className="absolute inset-0 rounded-full bg-primary/15 blur-md scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="font-mono text-lg font-semibold tracking-wider text-foreground">
            SPE<span className="text-primary text-glow-primary">Ǔ</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {filteredNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  isActive
                    ? "text-primary bg-primary/8"
                    : "text-foreground/55 hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-primary"
                    style={{ boxShadow: "0 0 6px var(--primary)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated && isAdmin && (
            <Link
              href="/admin"
              className="text-sm px-4 py-2 rounded-lg border border-border text-foreground/80 font-medium hover:bg-muted transition-all duration-300"
            >
              Адмінка
            </Link>
          )}
          {showCabinet && (
            <Link
              href="/cabinet"
              className="text-sm px-4 py-2 rounded-lg border border-primary/30 text-primary font-medium hover:bg-primary/8 hover:border-primary/50 transition-all duration-300"
            >
              {isAuthenticated ? "Кабінет" : "Увайсці"}
            </Link>
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Адкрыць/закрыць меню"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden w-full overflow-hidden border-0"
          >
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-1 max-w-7xl mx-auto">
              {filteredNav.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "text-primary bg-primary/8"
                        : "text-foreground/55 hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {label}
                  </Link>
                );
              })}
              {showCabinet && (
                <Link
                  href="/cabinet"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 text-sm px-4 py-3 rounded-lg border border-primary/30 text-primary font-medium text-center hover:bg-primary/8 transition-all"
                >
                  {isAuthenticated ? "Кабінет" : "Увайсці"}
                </Link>
              )}
              {isAuthenticated && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm px-4 py-3 rounded-lg border border-border text-foreground/80 font-medium text-center hover:bg-muted transition-all"
                >
                  Адмінка
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
