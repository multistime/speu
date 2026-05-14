import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ClientProviders } from "@/components/ClientProviders";
import { getPublicSiteNav, getExpandedSiteNav, type SiteNavItem } from "@/lib/site-nav";
import { createClient } from "@/lib/supabase/server";
import { getVisiblePublicHrefs } from "@/lib/site-visibility";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Спеў — Беларуская музыка на роднай мове",
  description:
    "Спеў — беларускі музычны лейбл. Ствараем добрую музыку на беларускай мове: ад нэа-фолку да электронікі. Корань у традыцыі, погляд — наперад.",
  keywords: ["беларуская музыка", "беларуская мова", "музычны лейбл", "Спеў", "нэа-фолк", "беларускія песні"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const visibleHrefsArray = Array.from(await getVisiblePublicHrefs());
  const publicNav = await getPublicSiteNav();
  let logoHref = publicNav.logoHref;
  const navItems = publicNav.items;

  let navItemsExpanded: SiteNavItem[] | undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: rpc } = await supabase.rpc("get_my_speu_profile");
    const prof = (Array.isArray(rpc) ? rpc[0] : rpc) as {
      is_admin?: boolean;
    } | null;
    if (prof?.is_admin) {
      const exp = await getExpandedSiteNav(supabase);
      navItemsExpanded = exp.items;
      logoHref = exp.logoHref;
    }
  }

  return (
    <html
      lang="be"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} dark`}
      suppressHydrationWarning
    >
      {/*
        Theme init script — runs before React hydration to avoid flash.
        Dark is the SSR default; remove it if user has saved light preference.
      */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('speu-theme');if(t==='light')document.documentElement.classList.remove('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <ClientProviders>
          <Navbar
            visibleHrefs={visibleHrefsArray}
            logoHref={logoHref}
            navItems={navItems}
            navItemsExpanded={navItemsExpanded}
          />
          <main>{children}</main>
          <Footer
            visibleHrefs={visibleHrefsArray}
            logoHref={logoHref}
            navItems={navItems}
            navItemsExpanded={navItemsExpanded}
          />
        </ClientProviders>
      </body>
    </html>
  );
}
