import type { UiAccentPresetId } from "@/lib/speu/ui-accent";

/**
 * Flat CSS custom properties applied on document.documentElement (camelCase → --kebab).
 * Values match shadcn semantic tokens + Speu extras for glow, selection, topography.
 */
export type UiThemeCssVars = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  glassBg: string;
  glassBorder: string;
  /** Comma-separated RGB for rgba(var(--glow-primary-rgb), a) */
  glowPrimaryRgb: string;
  glowAccentRgb: string;
  /** Comma-separated RGB for ::selection background (mode-specific) */
  selectionBgRgb: string;
  /** ::selection text color */
  selectionForeground: string;
  /** Light body ornament stroke, hex without # (for SVG data URL builder) */
  ornamentStrokeHex: string;
};

export type TopoSpec = {
  dark: {
    bg: [string, string, string];
    contourR: number;
    contourGFrom: number;
    contourGTo: number;
    contourB: number;
    amber: [number, number, number];
  };
  light: {
    bg: [string, string, string];
    contourRgb: string;
    amber: [number, number, number];
  };
};

export type PresetThemeBundle = {
  light: UiThemeCssVars;
  dark: UiThemeCssVars;
  topo: TopoSpec;
};

/** Canonical «Начны лес» — matches current globals.css production. */
const lyasun: PresetThemeBundle = {
  light: {
    background: "#F6F2E8",
    foreground: "#191D18",
    card: "#FEFCF3",
    cardForeground: "#191D18",
    popover: "#FEFCF3",
    popoverForeground: "#191D18",
    primary: "#35654D",
    primaryForeground: "#FFFFFF",
    secondary: "rgba(53, 101, 77, 0.08)",
    secondaryForeground: "#2B3C30",
    muted: "rgba(45, 65, 50, 0.055)",
    mutedForeground: "#6A7870",
    accent: "#BF7535",
    accentForeground: "#FFFFFF",
    destructive: "#C0392B",
    border: "rgba(45, 65, 50, 0.13)",
    input: "rgba(53, 101, 77, 0.09)",
    ring: "rgba(53, 101, 77, 0.32)",
    sidebar: "#EDE8DA",
    sidebarForeground: "#191D18",
    sidebarPrimary: "#35654D",
    sidebarPrimaryForeground: "#FFFFFF",
    sidebarAccent: "rgba(53, 101, 77, 0.09)",
    sidebarAccentForeground: "#191D18",
    sidebarBorder: "rgba(45, 65, 50, 0.10)",
    sidebarRing: "rgba(53, 101, 77, 0.32)",
    glassBg: "rgba(254, 252, 243, 0.80)",
    glassBorder: "rgba(53, 101, 77, 0.11)",
    glowPrimaryRgb: "53, 101, 77",
    glowAccentRgb: "191, 117, 53",
    selectionBgRgb: "53, 101, 77",
    selectionForeground: "#35654D",
    ornamentStrokeHex: "35654D",
  },
  dark: {
    background: "#0E1811",
    foreground: "#E2E8DD",
    card: "rgba(16, 28, 20, 0.92)",
    cardForeground: "#E2E8DD",
    popover: "#101C14",
    popoverForeground: "#E2E8DD",
    primary: "#7DBF9E",
    primaryForeground: "#0E1811",
    secondary: "rgba(125, 191, 158, 0.08)",
    secondaryForeground: "#C8DDD0",
    muted: "rgba(255, 255, 255, 0.05)",
    mutedForeground: "#7A8878",
    accent: "#D4944A",
    accentForeground: "#0E1811",
    destructive: "oklch(0.65 0.25 27)",
    border: "rgba(125, 191, 158, 0.10)",
    input: "rgba(125, 191, 158, 0.07)",
    ring: "rgba(125, 191, 158, 0.35)",
    sidebar: "#0C1812",
    sidebarForeground: "#E2E8DD",
    sidebarPrimary: "#7DBF9E",
    sidebarPrimaryForeground: "#0E1811",
    sidebarAccent: "rgba(125, 191, 158, 0.08)",
    sidebarAccentForeground: "#C8DDD0",
    sidebarBorder: "rgba(125, 191, 158, 0.10)",
    sidebarRing: "rgba(125, 191, 158, 0.35)",
    glassBg: "rgba(14, 24, 17, 0.80)",
    glassBorder: "rgba(125, 191, 158, 0.12)",
    glowPrimaryRgb: "125, 191, 158",
    glowAccentRgb: "212, 148, 74",
    selectionBgRgb: "125, 191, 158",
    selectionForeground: "#7DBF9E",
    ornamentStrokeHex: "35654D",
  },
  topo: {
    dark: {
      bg: ["rgba(14,28,22,0.95)", "rgba(11,18,16,0.97)", "rgba(6,10,8,1)"],
      contourR: 40,
      contourGFrom: 160,
      contourGTo: 222,
      contourB: 70,
      amber: [200, 140, 40],
    },
    light: {
      bg: ["rgba(246,242,232,1)", "rgba(242,237,224,1)", "rgba(234,229,212,1)"],
      contourRgb: "53,101,77",
      amber: [191, 117, 53],
    },
  },
};

/** Папараць — цёмны мох (купальскі лес), адрозны ад светлай шалвы «Начны лес». */
const paparatPreset: PresetThemeBundle = {
  light: {
    background: "#F4F6F0",
    foreground: "#152018",
    card: "#FCFDF9",
    cardForeground: "#152018",
    popover: "#FCFDF9",
    popoverForeground: "#152018",
    primary: "#2B5035",
    primaryForeground: "#FFFFFF",
    secondary: "rgba(43, 80, 53, 0.10)",
    secondaryForeground: "#1E2E22",
    muted: "rgba(43, 70, 50, 0.06)",
    mutedForeground: "#5A6B5E",
    accent: "#C47A28",
    accentForeground: "#FFFFFF",
    destructive: "#C0392B",
    border: "rgba(43, 80, 53, 0.14)",
    input: "rgba(43, 80, 53, 0.10)",
    ring: "rgba(43, 80, 53, 0.38)",
    sidebar: "#E8EDE4",
    sidebarForeground: "#152018",
    sidebarPrimary: "#2B5035",
    sidebarPrimaryForeground: "#FFFFFF",
    sidebarAccent: "rgba(43, 80, 53, 0.10)",
    sidebarAccentForeground: "#152018",
    sidebarBorder: "rgba(43, 70, 50, 0.11)",
    sidebarRing: "rgba(43, 80, 53, 0.38)",
    glassBg: "rgba(252, 253, 249, 0.82)",
    glassBorder: "rgba(43, 80, 53, 0.12)",
    glowPrimaryRgb: "43, 80, 53",
    glowAccentRgb: "196, 122, 40",
    selectionBgRgb: "43, 80, 53",
    selectionForeground: "#2B5035",
    ornamentStrokeHex: "2B5035",
  },
  dark: {
    background: "#08120C",
    foreground: "#D8E8DC",
    card: "rgba(12, 22, 15, 0.94)",
    cardForeground: "#D8E8DC",
    popover: "#0A1610",
    popoverForeground: "#D8E8DC",
    primary: "#4A8062",
    primaryForeground: "#0A0F0C",
    secondary: "rgba(74, 128, 98, 0.12)",
    secondaryForeground: "#B5D0C0",
    muted: "rgba(255, 255, 255, 0.06)",
    mutedForeground: "#7A9284",
    accent: "#E8B060",
    accentForeground: "#0A0F0C",
    destructive: "oklch(0.65 0.25 27)",
    border: "rgba(74, 128, 98, 0.14)",
    input: "rgba(74, 128, 98, 0.09)",
    ring: "rgba(74, 128, 98, 0.42)",
    sidebar: "#060E0A",
    sidebarForeground: "#D8E8DC",
    sidebarPrimary: "#4A8062",
    sidebarPrimaryForeground: "#0A0F0C",
    sidebarAccent: "rgba(74, 128, 98, 0.12)",
    sidebarAccentForeground: "#B5D0C0",
    sidebarBorder: "rgba(74, 128, 98, 0.12)",
    sidebarRing: "rgba(74, 128, 98, 0.42)",
    glassBg: "rgba(8, 18, 12, 0.85)",
    glassBorder: "rgba(74, 128, 98, 0.14)",
    glowPrimaryRgb: "74, 128, 98",
    glowAccentRgb: "232, 176, 96",
    selectionBgRgb: "74, 128, 98",
    selectionForeground: "#4A8062",
    ornamentStrokeHex: "2B5035",
  },
  topo: {
    dark: {
      bg: ["rgba(10,22,14,0.96)", "rgba(8,16,12,0.98)", "rgba(4,8,6,1)"],
      contourR: 36,
      contourGFrom: 150,
      contourGTo: 210,
      contourB: 64,
      amber: [210, 150, 50],
    },
    light: {
      bg: ["rgba(244,246,240,1)", "rgba(238,242,234,1)", "rgba(230,236,226,1)"],
      contourRgb: "43,80,53",
      amber: [196, 122, 40],
    },
  },
};

/** Гарадская сінь — халодныя сінія тоны. */
const vuzel: PresetThemeBundle = {
  light: {
    background: "#EEF2F9",
    foreground: "#121820",
    card: "#F7F9FD",
    cardForeground: "#121820",
    popover: "#F7F9FD",
    popoverForeground: "#121820",
    primary: "#3A5A8C",
    primaryForeground: "#FFFFFF",
    secondary: "rgba(58, 90, 140, 0.09)",
    secondaryForeground: "#1E2A40",
    muted: "rgba(30, 50, 80, 0.06)",
    mutedForeground: "#5A6678",
    accent: "#5B8FC8",
    accentForeground: "#FFFFFF",
    destructive: "#C0392B",
    border: "rgba(58, 90, 140, 0.12)",
    input: "rgba(58, 90, 140, 0.08)",
    ring: "rgba(58, 90, 140, 0.35)",
    sidebar: "#E4EAF4",
    sidebarForeground: "#121820",
    sidebarPrimary: "#3A5A8C",
    sidebarPrimaryForeground: "#FFFFFF",
    sidebarAccent: "rgba(58, 90, 140, 0.10)",
    sidebarAccentForeground: "#121820",
    sidebarBorder: "rgba(58, 90, 140, 0.10)",
    sidebarRing: "rgba(58, 90, 140, 0.35)",
    glassBg: "rgba(247, 249, 253, 0.85)",
    glassBorder: "rgba(58, 90, 140, 0.11)",
    glowPrimaryRgb: "58, 90, 140",
    glowAccentRgb: "91, 143, 200",
    selectionBgRgb: "58, 90, 140",
    selectionForeground: "#3A5A8C",
    ornamentStrokeHex: "3A5A8C",
  },
  dark: {
    background: "#080E18",
    foreground: "#D8E2F0",
    card: "rgba(12, 18, 32, 0.92)",
    cardForeground: "#D8E2F0",
    popover: "#0C1422",
    popoverForeground: "#D8E2F0",
    primary: "#7BA3D9",
    primaryForeground: "#080E18",
    secondary: "rgba(123, 163, 217, 0.10)",
    secondaryForeground: "#B8CCE8",
    muted: "rgba(255, 255, 255, 0.05)",
    mutedForeground: "#8A9AAF",
    accent: "#9BB8E8",
    accentForeground: "#080E18",
    destructive: "oklch(0.65 0.25 27)",
    border: "rgba(123, 163, 217, 0.12)",
    input: "rgba(123, 163, 217, 0.08)",
    ring: "rgba(123, 163, 217, 0.38)",
    sidebar: "#060A14",
    sidebarForeground: "#D8E2F0",
    sidebarPrimary: "#7BA3D9",
    sidebarPrimaryForeground: "#080E18",
    sidebarAccent: "rgba(123, 163, 217, 0.10)",
    sidebarAccentForeground: "#B8CCE8",
    sidebarBorder: "rgba(123, 163, 217, 0.12)",
    sidebarRing: "rgba(123, 163, 217, 0.38)",
    glassBg: "rgba(8, 14, 24, 0.82)",
    glassBorder: "rgba(123, 163, 217, 0.14)",
    glowPrimaryRgb: "123, 163, 217",
    glowAccentRgb: "155, 184, 232",
    selectionBgRgb: "123, 163, 217",
    selectionForeground: "#7BA3D9",
    ornamentStrokeHex: "3A5A8C",
  },
  topo: {
    dark: {
      bg: ["rgba(12,20,36,0.95)", "rgba(8,14,24,0.97)", "rgba(4,8,16,1)"],
      contourR: 50,
      contourGFrom: 120,
      contourGTo: 190,
      contourB: 200,
      amber: [180, 140, 90],
    },
    light: {
      bg: ["rgba(238,242,249,1)", "rgba(232,238,246,1)", "rgba(224,232,244,1)"],
      contourRgb: "58,90,140",
      amber: [91, 143, 200],
    },
  },
};

/** Ранішняя бурштына — цёплыя крэмавыя і бурштын. */
const rasitsa: PresetThemeBundle = {
  light: {
    background: "#FAF4EC",
    foreground: "#1C1410",
    card: "#FFF9F3",
    cardForeground: "#1C1410",
    popover: "#FFF9F3",
    popoverForeground: "#1C1410",
    primary: "#B8732A",
    primaryForeground: "#FFFFFF",
    secondary: "rgba(184, 115, 42, 0.10)",
    secondaryForeground: "#3D2818",
    muted: "rgba(80, 50, 30, 0.06)",
    mutedForeground: "#6A5A4A",
    accent: "#8B5A2B",
    accentForeground: "#FFFFFF",
    destructive: "#C0392B",
    border: "rgba(120, 70, 40, 0.14)",
    input: "rgba(184, 115, 42, 0.10)",
    ring: "rgba(184, 115, 42, 0.35)",
    sidebar: "#F2E8DC",
    sidebarForeground: "#1C1410",
    sidebarPrimary: "#B8732A",
    sidebarPrimaryForeground: "#FFFFFF",
    sidebarAccent: "rgba(184, 115, 42, 0.10)",
    sidebarAccentForeground: "#1C1410",
    sidebarBorder: "rgba(120, 70, 40, 0.11)",
    sidebarRing: "rgba(184, 115, 42, 0.35)",
    glassBg: "rgba(255, 249, 243, 0.88)",
    glassBorder: "rgba(184, 115, 42, 0.12)",
    glowPrimaryRgb: "184, 115, 42",
    glowAccentRgb: "139, 90, 43",
    selectionBgRgb: "184, 115, 42",
    selectionForeground: "#B8732A",
    ornamentStrokeHex: "B8732A",
  },
  dark: {
    background: "#140C08",
    foreground: "#F0E4D8",
    card: "rgba(28, 18, 12, 0.94)",
    cardForeground: "#F0E4D8",
    popover: "#1A100A",
    popoverForeground: "#F0E4D8",
    primary: "#E4A04A",
    primaryForeground: "#140C08",
    secondary: "rgba(228, 160, 74, 0.12)",
    secondaryForeground: "#F0D4B0",
    muted: "rgba(255, 255, 255, 0.06)",
    mutedForeground: "#A89888",
    accent: "#F0C078",
    accentForeground: "#140C08",
    destructive: "oklch(0.65 0.25 27)",
    border: "rgba(228, 160, 74, 0.14)",
    input: "rgba(228, 160, 74, 0.09)",
    ring: "rgba(228, 160, 74, 0.40)",
    sidebar: "#100808",
    sidebarForeground: "#F0E4D8",
    sidebarPrimary: "#E4A04A",
    sidebarPrimaryForeground: "#140C08",
    sidebarAccent: "rgba(228, 160, 74, 0.12)",
    sidebarAccentForeground: "#F0D4B0",
    sidebarBorder: "rgba(228, 160, 74, 0.12)",
    sidebarRing: "rgba(228, 160, 74, 0.40)",
    glassBg: "rgba(20, 12, 8, 0.85)",
    glassBorder: "rgba(228, 160, 74, 0.14)",
    glowPrimaryRgb: "228, 160, 74",
    glowAccentRgb: "240, 192, 120",
    selectionBgRgb: "228, 160, 74",
    selectionForeground: "#E4A04A",
    ornamentStrokeHex: "B8732A",
  },
  topo: {
    dark: {
      bg: ["rgba(36,22,14,0.95)", "rgba(24,14,10,0.97)", "rgba(12,8,6,1)"],
      contourR: 120,
      contourGFrom: 90,
      contourGTo: 140,
      contourB: 50,
      amber: [220, 160, 60],
    },
    light: {
      bg: ["rgba(250,244,236,1)", "rgba(246,238,228,1)", "rgba(240,230,216,1)"],
      contourRgb: "184,115,42",
      amber: [139, 90, 43],
    },
  },
};

/** Балотная фіялет — ліловыя глыбіні. */
const balota: PresetThemeBundle = {
  light: {
    background: "#F5F0F8",
    foreground: "#1A1220",
    card: "#FBF8FD",
    cardForeground: "#1A1220",
    popover: "#FBF8FD",
    popoverForeground: "#1A1220",
    primary: "#7B4B8C",
    primaryForeground: "#FFFFFF",
    secondary: "rgba(123, 75, 140, 0.10)",
    secondaryForeground: "#2E1838",
    muted: "rgba(60, 40, 70, 0.06)",
    mutedForeground: "#6A5A72",
    accent: "#9B6B9B",
    accentForeground: "#FFFFFF",
    destructive: "#C0392B",
    border: "rgba(100, 60, 110, 0.12)",
    input: "rgba(123, 75, 140, 0.09)",
    ring: "rgba(123, 75, 140, 0.35)",
    sidebar: "#EDE6F2",
    sidebarForeground: "#1A1220",
    sidebarPrimary: "#7B4B8C",
    sidebarPrimaryForeground: "#FFFFFF",
    sidebarAccent: "rgba(123, 75, 140, 0.10)",
    sidebarAccentForeground: "#1A1220",
    sidebarBorder: "rgba(100, 60, 110, 0.10)",
    sidebarRing: "rgba(123, 75, 140, 0.35)",
    glassBg: "rgba(251, 248, 253, 0.86)",
    glassBorder: "rgba(123, 75, 140, 0.11)",
    glowPrimaryRgb: "123, 75, 140",
    glowAccentRgb: "155, 107, 155",
    selectionBgRgb: "123, 75, 140",
    selectionForeground: "#7B4B8C",
    ornamentStrokeHex: "7B4B8C",
  },
  dark: {
    background: "#100818",
    foreground: "#E8E0F0",
    card: "rgba(22, 14, 32, 0.94)",
    cardForeground: "#E8E0F0",
    popover: "#160F20",
    popoverForeground: "#E8E0F0",
    primary: "#C49AC4",
    primaryForeground: "#100818",
    secondary: "rgba(196, 154, 196, 0.12)",
    secondaryForeground: "#D8C0E0",
    muted: "rgba(255, 255, 255, 0.05)",
    mutedForeground: "#9A8AA8",
    accent: "#D4B0D4",
    accentForeground: "#100818",
    destructive: "oklch(0.65 0.25 27)",
    border: "rgba(196, 154, 196, 0.14)",
    input: "rgba(196, 154, 196, 0.08)",
    ring: "rgba(196, 154, 196, 0.38)",
    sidebar: "#0C0612",
    sidebarForeground: "#E8E0F0",
    sidebarPrimary: "#C49AC4",
    sidebarPrimaryForeground: "#100818",
    sidebarAccent: "rgba(196, 154, 196, 0.10)",
    sidebarAccentForeground: "#D8C0E0",
    sidebarBorder: "rgba(196, 154, 196, 0.12)",
    sidebarRing: "rgba(196, 154, 196, 0.38)",
    glassBg: "rgba(16, 8, 24, 0.84)",
    glassBorder: "rgba(196, 154, 196, 0.14)",
    glowPrimaryRgb: "196, 154, 196",
    glowAccentRgb: "212, 176, 212",
    selectionBgRgb: "196, 154, 196",
    selectionForeground: "#C49AC4",
    ornamentStrokeHex: "7B4B8C",
  },
  topo: {
    dark: {
      bg: ["rgba(28,16,36,0.95)", "rgba(18,10,26,0.97)", "rgba(10,6,14,1)"],
      contourR: 100,
      contourGFrom: 70,
      contourGTo: 130,
      contourB: 140,
      amber: [180, 120, 160],
    },
    light: {
      bg: ["rgba(245,240,248,1)", "rgba(238,232,244,1)", "rgba(230,222,238,1)"],
      contourRgb: "123,75,140",
      amber: [155, 107, 155],
    },
  },
};

/** Жытнёвае золата — солома і золата. */
const zhytnik: PresetThemeBundle = {
  light: {
    background: "#F9F6E8",
    foreground: "#1C1808",
    card: "#FFFDF5",
    cardForeground: "#1C1808",
    popover: "#FFFDF5",
    popoverForeground: "#1C1808",
    primary: "#9A8018",
    primaryForeground: "#FFFFFF",
    secondary: "rgba(154, 128, 24, 0.10)",
    secondaryForeground: "#3A3210",
    muted: "rgba(100, 90, 40, 0.07)",
    mutedForeground: "#6A6240",
    accent: "#B89420",
    accentForeground: "#1C1808",
    destructive: "#C0392B",
    border: "rgba(154, 128, 24, 0.14)",
    input: "rgba(154, 128, 24, 0.10)",
    ring: "rgba(154, 128, 24, 0.38)",
    sidebar: "#F0ECD8",
    sidebarForeground: "#1C1808",
    sidebarPrimary: "#9A8018",
    sidebarPrimaryForeground: "#FFFFFF",
    sidebarAccent: "rgba(154, 128, 24, 0.10)",
    sidebarAccentForeground: "#1C1808",
    sidebarBorder: "rgba(120, 100, 30, 0.11)",
    sidebarRing: "rgba(154, 128, 24, 0.38)",
    glassBg: "rgba(255, 253, 245, 0.88)",
    glassBorder: "rgba(154, 128, 24, 0.12)",
    glowPrimaryRgb: "154, 128, 24",
    glowAccentRgb: "184, 148, 32",
    selectionBgRgb: "154, 128, 24",
    selectionForeground: "#9A8018",
    ornamentStrokeHex: "9A8018",
  },
  dark: {
    background: "#121008",
    foreground: "#F0EAD0",
    card: "rgba(28, 24, 12, 0.94)",
    cardForeground: "#F0EAD0",
    popover: "#18140C",
    popoverForeground: "#F0EAD0",
    primary: "#E0C24A",
    primaryForeground: "#121008",
    secondary: "rgba(224, 194, 74, 0.12)",
    secondaryForeground: "#E8D898",
    muted: "rgba(255, 255, 255, 0.05)",
    mutedForeground: "#A89870",
    accent: "#F0D060",
    accentForeground: "#121008",
    destructive: "oklch(0.65 0.25 27)",
    border: "rgba(224, 194, 74, 0.14)",
    input: "rgba(224, 194, 74, 0.09)",
    ring: "rgba(224, 194, 74, 0.42)",
    sidebar: "#0E0C06",
    sidebarForeground: "#F0EAD0",
    sidebarPrimary: "#E0C24A",
    sidebarPrimaryForeground: "#121008",
    sidebarAccent: "rgba(224, 194, 74, 0.12)",
    sidebarAccentForeground: "#E8D898",
    sidebarBorder: "rgba(224, 194, 74, 0.12)",
    sidebarRing: "rgba(224, 194, 74, 0.42)",
    glassBg: "rgba(18, 16, 8, 0.86)",
    glassBorder: "rgba(224, 194, 74, 0.14)",
    glowPrimaryRgb: "224, 194, 74",
    glowAccentRgb: "240, 208, 96",
    selectionBgRgb: "224, 194, 74",
    selectionForeground: "#E0C24A",
    ornamentStrokeHex: "9A8018",
  },
  topo: {
    dark: {
      bg: ["rgba(32,28,12,0.95)", "rgba(22,20,10,0.97)", "rgba(12,10,6,1)"],
      contourR: 140,
      contourGFrom: 120,
      contourGTo: 180,
      contourB: 40,
      amber: [220, 180, 50],
    },
    light: {
      bg: ["rgba(249,246,232,1)", "rgba(244,240,224,1)", "rgba(236,232,212,1)"],
      contourRgb: "154,128,24",
      amber: [184, 148, 32],
    },
  },
};

export const UI_THEME_BY_PRESET: Record<UiAccentPresetId, PresetThemeBundle> = {
  lyasun,
  paparat: paparatPreset,
  vuzel,
  rasitsa,
  balota,
  zhytnik,
};

function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** Maps UiThemeCssVars to CSS custom property names (--background, …). */
export function uiThemeVarsToCssProps(vars: UiThemeCssVars): Record<string, string> {
  const out: Record<string, string> = {};
  (Object.entries(vars) as [keyof UiThemeCssVars, string][]).forEach(([k, v]) => {
    if (k === "ornamentStrokeHex") {
      out["--ornament-stroke-hex"] = v;
      return;
    }
    const cssKey = `--${camelToKebab(k)}`;
    out[cssKey] = v;
  });
  return out;
}

export function getPresetThemeBundle(presetId: UiAccentPresetId): PresetThemeBundle {
  return UI_THEME_BY_PRESET[presetId] ?? lyasun;
}

export function getTopoSpec(presetId: UiAccentPresetId): TopoSpec {
  return getPresetThemeBundle(presetId).topo;
}

/** Light-mode body watermark; `hex` without leading # */
export function buildOrnamentBackgroundImage(hex: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><path d='M40 6L74 40L40 74L6 40Z' stroke='#${hex}' stroke-width='0.7' fill='none' stroke-opacity='0.055'/><path d='M40 22L58 40L40 58L22 40Z' stroke='#${hex}' stroke-width='0.5' fill='none' stroke-opacity='0.04'/><circle cx='40' cy='5' r='1.3' fill='#${hex}' fill-opacity='0.05'/><circle cx='75' cy='40' r='1.3' fill='#${hex}' fill-opacity='0.05'/><circle cx='40' cy='75' r='1.3' fill='#${hex}' fill-opacity='0.05'/><circle cx='5' cy='40' r='1.3' fill='#${hex}' fill-opacity='0.05'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function getUiThemeCssVarsForMode(
  presetId: UiAccentPresetId,
  isDark: boolean,
): Record<string, string> {
  const bundle = getPresetThemeBundle(presetId);
  const vars = isDark ? bundle.dark : bundle.light;
  return uiThemeVarsToCssProps(vars);
}
