/** Падраздзелы «Сайт» у адмінцы — URL /admin/site/… */

export const SITE_NAV_SEGMENTS = {
  overview: "",
  content: "content",
  footer: "footer",
  supportTiers: "support-tiers",
  serviceRequests: "service-requests",
  users: "users",
  radio: "radio",
  settings: "settings",
} as const;

export type SiteNavSectionKey = keyof typeof SITE_NAV_SEGMENTS;

export function siteNavPath(key: SiteNavSectionKey): string {
  if (key === "overview") return "/admin/site";
  if (key === "settings") return "/admin/settings";
  return `/admin/site/${SITE_NAV_SEGMENTS[key]}`;
}

export const SITE_NAV_SECTIONS: {
  key: SiteNavSectionKey;
  label: string;
  pathSuffix: string;
  blurb: string;
}[] = [
  {
    key: "overview",
    label: "Агляд",
    pathSuffix: "",
    blurb: "Кароткая статыстыка і спасылкі",
  },
  {
    key: "content",
    label: "Кантэнт",
    pathSuffix: SITE_NAV_SEGMENTS.content,
    blurb: "CMS-блокі старонак",
  },
  {
    key: "footer",
    label: "Футэр",
    pathSuffix: SITE_NAV_SEGMENTS.footer,
    blurb: "Тэкст, сацсеткі, кантакты",
  },
  {
    key: "supportTiers",
    label: "Падтрымка",
    pathSuffix: SITE_NAV_SEGMENTS.supportTiers,
    blurb: "Тарыфы падтрымкі",
  },
  {
    key: "serviceRequests",
    label: "Заяўкі",
    pathSuffix: SITE_NAV_SEGMENTS.serviceRequests,
    blurb: "Звароты з формы паслуг",
  },
  {
    key: "users",
    label: "Карыстальнікі",
    pathSuffix: SITE_NAV_SEGMENTS.users,
    blurb: "Уліковыя запісы і ролі",
  },
  {
    key: "radio",
    label: "Радыё",
    pathSuffix: SITE_NAV_SEGMENTS.radio,
    blurb: "Налады радыё",
  },
  {
    key: "settings",
    label: "Наладкі",
    pathSuffix: SITE_NAV_SEGMENTS.settings,
    blurb: "Налады адмінкі і інтэграцый",
  },
];
