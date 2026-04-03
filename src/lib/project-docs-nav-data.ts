/** Якарыстоўваецца сайдбарам «Праект» і старонкай /admin/project */

export const PROJECT_DOCS_SECTION_IDS = {
  overview: "project-overview",
  roadmap: "project-roadmap",
  tickets: "project-tickets",
  readme: "project-readme",
} as const;

export type ProjectDocsSectionKey = keyof typeof PROJECT_DOCS_SECTION_IDS;

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
