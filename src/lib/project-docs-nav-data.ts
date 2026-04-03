/** Якарыстоўваецца сайдбарам «Праект» і маршрутамі /admin/project/… */

export const PROJECT_DOCS_ROUTE_SEGMENTS = {
  overview: "overview",
  roadmap: "roadmap",
  tickets: "tickets",
  /** README.md у рэпазіторыі — URL «structure» */
  readme: "structure",
} as const;

export type ProjectDocsSectionKey = keyof typeof PROJECT_DOCS_ROUTE_SEGMENTS;

export function projectDocPath(key: ProjectDocsSectionKey): string {
  return `/admin/project/${PROJECT_DOCS_ROUTE_SEGMENTS[key]}`;
}

export function parseProjectDocRouteSegment(segment: string): ProjectDocsSectionKey | null {
  const entry = Object.entries(PROJECT_DOCS_ROUTE_SEGMENTS).find(([, v]) => v === segment);
  return entry ? (entry[0] as ProjectDocsSectionKey) : null;
}

export const PROJECT_DOCS_NAV_SECTIONS: {
  key: ProjectDocsSectionKey;
  label: string;
  file: string;
  blurb: string;
}[] = [
  {
    key: "overview",
    label: "База ведаў",
    file: "OVERVIEW.md",
    blurb: "Прадукт, стэйкхолдэры, рызыкі",
  },
  {
    key: "roadmap",
    label: "Роадмэп",
    file: "ROADMAP.md",
    blurb: "Планы па часе",
  },
  {
    key: "tickets",
    label: "Тікеты",
    file: "TICKETS.md",
    blurb: "Бэклог і статусы",
  },
  {
    key: "readme",
    label: "Структура файлаў",
    file: "README.md",
    blurb: "Што за што адказвае",
  },
];
