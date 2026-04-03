/**
 * Product roles in admin UI (staff codes owner/editor/… stay DB-only).
 * - listener: звычайны карыстальнік (па змаўчанні — без асобай радка ролі).
 * - artist: уліковы запіс звязаны 1:1 з карточкай артыста лэйбла (`speu.artists.user_id`) — пад будучы кабінет і аналітыку.
 * - admin: доступ у адмінку (`profiles.is_admin` праз `user_roles`).
 */
export const ADMIN_UI_ROLE_CODES = ["listener", "artist", "admin"] as const;

export type AdminUiRoleCode = (typeof ADMIN_UI_ROLE_CODES)[number];

export const ADMIN_UI_ROLE_LABELS: Record<AdminUiRoleCode, string> = {
  listener: "Слухач",
  artist: "Артыст",
  admin: "Адмін",
};

/** Other role codes we show read-only in the user card (e.g. owner). */
export const STAFF_ROLE_LABELS: Record<string, string> = {
  owner: "Уладальнік",
  editor: "Рэдактар",
  support: "Падтрымка",
  viewer: "Толькі прагляд",
};
