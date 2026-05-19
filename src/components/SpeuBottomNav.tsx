"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Home, LogIn, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  SPEU_HUB_HREF,
  SPEU_LIKED_HREF,
  SPEU_SEARCH_HREF,
} from "@/lib/site-route-slugs";
import { createClient } from "@/lib/supabase/client";

type SpeuBottomNavBarProps = {
  logoHref: string;
};

/** Радок таб-бара без fixed — ніжні радок у `MobileBottomStack`. */
export function SpeuBottomNavBar({ logoHref }: SpeuBottomNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const hubHomeHref = logoHref === "/" ? SPEU_HUB_HREF : logoHref;

  useEffect(() => {
    const supabase = createClient();
    const apply = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(Boolean(data.user));
    };
    void apply();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    router.prefetch(SPEU_SEARCH_HREF);
    router.prefetch(SPEU_LIKED_HREF);
    router.prefetch(hubHomeHref);
    router.prefetch("/cabinet");
  }, [router, hubHomeHref]);

  const homeActive =
    pathname === hubHomeHref ||
    pathname === SPEU_HUB_HREF ||
    (pathname.startsWith(`${SPEU_HUB_HREF}/`) &&
      !pathname.startsWith(`${SPEU_LIKED_HREF}`) &&
      !pathname.startsWith(SPEU_SEARCH_HREF));
  const searchActive =
    pathname === SPEU_SEARCH_HREF || pathname.startsWith(`${SPEU_SEARCH_HREF}/`);
  const likedActive =
    pathname === SPEU_LIKED_HREF || pathname.startsWith(`${SPEU_LIKED_HREF}/`);
  const cabinetActive = pathname === "/cabinet" || pathname.startsWith("/cabinet/");

  const navItem = (
    href: string,
    label: string,
    Icon: typeof Home,
    active: boolean,
  ) => (
    <Link
      key={href}
      href={href}
      prefetch
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium leading-tight sm:text-xs",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} strokeWidth={1.75} />
      <span className="max-w-[4.75rem] text-center">{label}</span>
    </Link>
  );

  return (
    <nav
      className={cn(
        "w-full border-t border-border bg-background/95 backdrop-blur-md",
        "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1",
      )}
      aria-label="Ніжняя навігацыя"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {navItem(hubHomeHref, "Галоўная", Home, homeActive)}
        {navItem(SPEU_SEARCH_HREF, "Пошук", Search, searchActive)}
        {navItem(SPEU_LIKED_HREF, "Улюбёныя", Heart, likedActive)}
        {navItem(
          "/cabinet",
          isAuthenticated ? "Кабінет" : "Увайсці",
          isAuthenticated ? User : LogIn,
          cabinetActive,
        )}
      </div>
    </nav>
  );
}
