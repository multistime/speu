"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Music2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";
import { SiteNavIcon } from "@/components/SiteNavIcon";
import type { SiteNavItem } from "@/lib/site-nav";
import { SPEU_HUB_HREF } from "@/lib/site-route-slugs";
import type { FooterConfig, FooterLinkEntry } from "@/lib/footer-config";
import { cn } from "@/lib/utils";

function InstagramSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

function YoutubeSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function SpotifySvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function TelegramSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function SoundCloudSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M1.175 12.225c-.017 0-.034.002-.05.005-.083-.735-.083-1.478 0-2.213.016.003.033.005.05.005.44 0 .797-.357.797-.797s-.357-.797-.797-.797c-.44 0-.797.357-.797.797 0 .22.089.419.233.564A7.86 7.86 0 0 0 0 12.225c0 .44.357.797.797.797s.797-.357.797-.797-.357-.797-.797-.797zm2.197 1.275c-.442 0-.8-.358-.8-.8V10.2c0-.442.358-.8.8-.8.442 0 .8.358.8.8v2.5c0 .442-.358.8-.8.8zm2.2 1.125c-.442 0-.8-.358-.8-.8V9.075c0-.442.358-.8.8-.8.442 0 .8.358.8.8v5.475c0 .442-.358.8-.8.8zm2.2.375c-.442 0-.8-.358-.8-.8V8.7c0-.442.358-.8.8-.8.442 0 .8.358.8.8v5.85c0 .442-.358.8-.8.8zm2.2.225c-.442 0-.8-.358-.8-.8V8.475c0-.442.358-.8.8-.8.442 0 .8.358.8.8v6.075c0 .442-.358.8-.8.8zm2.225-.225c-.442 0-.8-.358-.8-.8V8.7c0-.442.358-.8.8-.8.442 0 .8.358.8.8v5.85c0 .442-.358.8-.8.8zm2.175-.375c-.442 0-.8-.358-.8-.8V9.075c0-.442.358-.8.8-.8.442 0 .8.358.8.8v5.475c0 .442-.358.8-.8.8zm2.2-1.125c-.442 0-.8-.358-.8-.8V10.2c0-.442.358-.8.8-.8.442 0 .8.358.8.8v2.5c0 .442-.358.8-.8.8zM21 8.325c-.17 0-.34.012-.505.035-.475-2.675-2.8-4.71-5.62-4.71-1.285 0-2.465.435-3.4 1.155-.375.3-.475.825-.175 1.2.3.375.825.475 1.2.175.65-.515 1.49-.83 2.375-.83 2.095 0 3.795 1.7 3.795 3.795 0 .09-.005.18-.01.265.175-.055.36-.085.55-.085 1.1 0 1.995.895 1.995 1.995S22.1 13.12 21 13.12H5.8c-.44 0-.797-.357-.797-.797s.357-.797.797-.797H21c.22 0 .4.18.4.4s-.18.4-.4.4z" />
    </svg>
  );
}

function FooterLinkGlyph({ kind, className }: { kind: string; className?: string }) {
  const k = kind.toLowerCase();
  if (k === "instagram") return <InstagramSvg className={className} />;
  if (k === "telegram") return <TelegramSvg className={className} />;
  if (k === "youtube") return <YoutubeSvg className={className} />;
  if (k === "spotify") return <SpotifySvg className={className} />;
  if (k === "soundcloud") return <SoundCloudSvg className={className} />;
  return <ExternalLink className={className} strokeWidth={1.5} aria-hidden />;
}

function filterFooterLinks(entries: FooterLinkEntry[]): FooterLinkEntry[] {
  return entries.filter((e) => e.enabled !== false && e.href.trim().length > 0);
}

const FOOTER_LINKS_LEGACY: SiteNavItem[] = [
  { slug: "speu", title: "Спеў", href: SPEU_HUB_HREF },
  { slug: "generator", title: "Генератар", href: "/generator" },
  { slug: "artists", title: "Артысты", href: "/artists" },
  { slug: "radio", title: "Радыё Мара", href: "/radio" },
  { slug: "services", title: "Паслугі", href: "/services" },
  { slug: "support", title: "Падтрымка", href: "/support" },
];

type FooterProps = {
  visibleHrefs: string[];
  logoHref: string;
  navItems: SiteNavItem[];
  navItemsExpanded?: SiteNavItem[];
  footerConfig: FooterConfig;
};

export function Footer({
  visibleHrefs,
  logoHref,
  navItems,
  navItemsExpanded,
  footerConfig,
}: FooterProps) {
  const visibleSet = new Set(visibleHrefs);
  const [adminShowAllPages, setAdminShowAllPages] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const run = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setAdminShowAllPages(false);
        setIsAdmin(false);
        return;
      }
      try {
        const profile = await getSpeuProfile(supabase, user.id);
        setIsAdmin(Boolean(profile?.is_admin));
        setAdminShowAllPages(Boolean(profile?.is_admin && profile?.admin_show_all_pages));
      } catch {
        setAdminShowAllPages(false);
        setIsAdmin(false);
      }
    };

    void run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void run();
    });
    return () => subscription.unsubscribe();
  }, []);

  const effectiveNav =
    isAdmin && adminShowAllPages && navItemsExpanded && navItemsExpanded.length > 0
      ? navItemsExpanded
      : navItems.length > 0
        ? navItems
        : FOOTER_LINKS_LEGACY.filter((l) => {
            if (adminShowAllPages) return true;
            return visibleSet.has(l.href);
          });

  const showNav = effectiveNav.length > 0;
  const socialShow = filterFooterLinks(footerConfig.social);
  const messengersShow = filterFooterLinks(footerConfig.messengers);
  const legalShow = (footerConfig.legal ?? []).filter((l) => l.enabled !== false && l.label.trim());

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className={cn(
            "grid gap-10 mb-10",
            showNav ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-1 md:grid-cols-2 md:max-w-4xl md:mx-auto",
          )}
        >
          <div>
            <Link href={logoHref} className="group flex items-center gap-2.5 mb-4">
              <Music2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <span className="font-mono text-base font-semibold tracking-wider text-foreground">
                SPE<span className="text-primary">Ǔ</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs whitespace-pre-wrap">
              {footerConfig.brandDescription}
            </p>
            {socialShow.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {socialShow.map((s, i) => (
                  <a
                    key={`social-${i}-${s.kind}`}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all duration-200"
                  >
                    <FooterLinkGlyph kind={s.kind} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {showNav && (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground/50 font-medium mb-4">
                Навігацыя
              </p>
              <ul className="space-y-2">
                {effectiveNav.map(({ href, title, slug }) => (
                  <li key={slug}>
                    <Link
                      href={href}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
                    >
                      <SiteNavIcon
                        slug={slug}
                        className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70 transition-opacity"
                      />
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground/50 font-medium mb-4">
              Кантакт
            </p>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed whitespace-pre-wrap">
              {footerConfig.contactIntro}
            </p>
            {footerConfig.contactEmail.trim() ? (
              <a
                href={`mailto:${footerConfig.contactEmail.trim()}`}
                className="text-sm text-primary hover:text-primary/80 transition-colors font-mono"
              >
                {footerConfig.contactEmail.trim()}
              </a>
            ) : null}

            {messengersShow.length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-muted-foreground/50 mb-2">{footerConfig.messengersTitle}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {messengersShow.map((m, i) => (
                    <a
                      key={`msg-${i}-${m.kind}`}
                      href={m.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <FooterLinkGlyph kind={m.kind} className="h-3.5 w-3.5 shrink-0" />
                      {m.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden className="text-primary opacity-50">
              <circle cx="7" cy="7" r="1.8" fill="currentColor" />
              <path
                d="M7 1.5v2.5M7 10v2.5M1.5 7h2.5M10 7h2.5M3 3l1.8 1.8M9.2 9.2L11 11M11 3L9.2 4.8M4.8 9.2L3 11"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-xs text-muted-foreground/40 font-mono whitespace-pre-wrap">
              {footerConfig.copyright}
            </p>
          </div>

          {legalShow.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-end">
              {legalShow.map((l, i) => (
                <a
                  key={`${l.label}-${i}`}
                  href={l.href || "#"}
                  className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
