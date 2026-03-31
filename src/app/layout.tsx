import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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

export const metadata: Metadata = {
  title: "Спеў — Беларуская музыка на роднай мове",
  description:
    "Спеў — беларускі музычны лейбл. Ствараем добрую музыку на беларускай мове: ад нэа-фолку да электронікі. Корань у традыцыі, погляд — наперад.",
  keywords: ["беларуская музыка", "беларуская мова", "музычны лейбл", "Спеў", "нэа-фолк", "беларускія песні"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
