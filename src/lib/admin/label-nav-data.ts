/** Падраздзелы лэйбла ў адмінцы — URL /admin/label/… */

export const LABEL_NAV_SEGMENTS = {
  overview: "overview",
  distribution: "distribution",
  songs: "songs",
  albums: "albums",
  artists: "artists",
} as const;

export type LabelNavSectionKey = keyof typeof LABEL_NAV_SEGMENTS;

export function labelNavPath(key: LabelNavSectionKey): string {
  return `/admin/label/${LABEL_NAV_SEGMENTS[key]}`;
}

export const LABEL_NAV_SECTIONS: {
  key: LabelNavSectionKey;
  label: string;
  pathSuffix: string;
  blurb: string;
}[] = [
  {
    key: "overview",
    label: "Агляд",
    pathSuffix: LABEL_NAV_SEGMENTS.overview,
    blurb: "Аналітыка праслухоўванняў і каталог",
  },
  {
    key: "distribution",
    label: "Дыстрыбуцыя",
    pathSuffix: LABEL_NAV_SEGMENTS.distribution,
    blurb: "Заяўкі на публікацыю з кабінета",
  },
  {
    key: "songs",
    label: "Песні",
    pathSuffix: LABEL_NAV_SEGMENTS.songs,
    blurb: "Каталог трэкаў",
  },
  {
    key: "albums",
    label: "Альбомы",
    pathSuffix: LABEL_NAV_SEGMENTS.albums,
    blurb: "Альбомы лэйбла",
  },
  {
    key: "artists",
    label: "Артысты",
    pathSuffix: LABEL_NAV_SEGMENTS.artists,
    blurb: "Картачкі артыстаў",
  },
];
