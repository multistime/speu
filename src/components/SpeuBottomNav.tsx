"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Heart, Home, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEU_HUB_HREF } from "@/lib/site-route-slugs";
import { useSpeuMobileChrome } from "@/contexts/SpeuMobileChromeContext";
import { useSyncSpeuTabBarHeight } from "@/hooks/use-speu-mobile-chrome-layout";

type SpeuBottomNavProps = {
  logoHref: string;
};

export function SpeuBottomNav({ logoHref }: SpeuBottomNavProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const { showBottomNav } = useSpeuMobileChrome();
  useSyncSpeuTabBarHeight(navRef, showBottomNav);

  if (!showBottomNav) return null;

  const homeActive =
    pathname === logoHref || (logoHref !== "/" && pathname.startsWith(`${logoHref}/`));
  const speuActive =
    (pathname === SPEU_HUB_HREF || pathname.startsWith(`${SPEU_HUB_HREF}/`)) &&
    !pathname.startsWith(`${SPEU_HUB_HREF}/liked`);
  const likedActive =
    pathname === `${SPEU_HUB_HREF}/liked` ||
    pathname.startsWith(`${SPEU_HUB_HREF}/liked/`);
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
      ref={navRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 backdrop-blur-md md:hidden",
        "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1",
      )}
      aria-label="Ніжняя навігацыя"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {navItem(logoHref, "Галоўная", Home, homeActive)}
        {navItem(SPEU_HUB_HREF, "Спеў", LayoutGrid, speuActive)}
        {navItem(`${SPEU_HUB_HREF}/liked`, "Улюбёныя", Heart, likedActive)}
        {navItem("/cabinet", "Кабінет", User, cabinetActive)}
      </div>
    </nav>
  );
}
