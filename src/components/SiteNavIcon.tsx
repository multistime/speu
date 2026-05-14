"use client";

import {
  Circle,
  Disc3,
  Headphones,
  Heart,
  LayoutGrid,
  Radio,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

const SLUG_ICONS: Record<string, LucideIcon> = {
  speu: Disc3,
  generator: Sparkles,
  artists: Users,
  radio: Radio,
  services: Headphones,
  support: Heart,
  cabinet: UserRound,
  home: Circle,
};

export function SiteNavIcon({
  slug,
  className,
  strokeWidth = 1.5,
}: {
  slug: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = SLUG_ICONS[slug] ?? LayoutGrid;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
