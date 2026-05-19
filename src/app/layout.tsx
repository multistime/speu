import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ClientProviders } from "@/components/ClientProviders";
import { MobileMainFrame } from "@/components/MobileMainFrame";
import { getExpandedSiteNav, type SiteNavItem } from "@/lib/site-nav";
import { createClient } from "@/lib/supabase/server";
import {
  getCachedFooterConfig,
  getCachedPublicSiteNav,
  getCachedVisiblePublicHrefs,
} from "@/lib/layout-data.server";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F2E8" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1811" },
  ],
};

const APP_NAME = "Спеў";
const APP_DESCRIPTION =
  "Спеў — беларускі музычны лейбл. Ствараем добрую музыку на беларускай мове: ад нэа-фолку да электронікі. Корань у традыцыі, погляд — наперад.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "Спеў — Беларуская музыка на роднай мове",
    template: "%s — Спеў",
  },
  description: APP_DESCRIPTION,
  keywords: ["беларуская музыка", "беларуская мова", "музычны лейбл", "Спеў", "нэа-фолк", "беларускія песні"],
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const visibleHrefsArray = await getCachedVisiblePublicHrefs();
  const publicNav = await getCachedPublicSiteNav();
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

  const footerConfig = await getCachedFooterConfig();

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
          <MobileMainFrame logoHref={logoHref}>{children}</MobileMainFrame>
          <Footer
            visibleHrefs={visibleHrefsArray}
            logoHref={logoHref}
            navItems={navItems}
            navItemsExpanded={navItemsExpanded}
            footerConfig={footerConfig}
          />
        </ClientProviders>
      </body>
    </html>
  );
}
