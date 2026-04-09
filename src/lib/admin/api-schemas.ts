import { z } from "zod";
import { ADMIN_UI_ROLE_CODES } from "@/lib/admin/user-roles";

const uiRoleEnum = z.enum(ADMIN_UI_ROLE_CODES);

const optionalAdminSlug = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  },
  z.string().min(1).max(200).optional()
);

/** POST/PATCH body for `/api/admin/songs` */
export const adminSongPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  /** Credited artists in order; first is primary (denormalized artist_id). */
  artistIds: z.array(z.string().uuid()).min(1),
  albumId: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  /** Slug у URL; пуста — аўта з назвы. Унікальнасць на баку сервера. */
  slug: optionalAdminSlug.optional(),
  audioUrl: z.string().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  durationSec: z.number().int().optional().nullable(),
  trackNumber: z.number().int().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
  playOnRadio: z.boolean().default(false),
});

export type AdminSongPayload = z.infer<typeof adminSongPayloadSchema>;

/** PATCH body for `/api/admin/users/[id]/roles` */
export const adminUserRolesPatchSchema = z
  .object({
    codes: z.array(uiRoleEnum),
    /** Required when `artist` is in codes: one or more speu.artists.id bound via artists.user_id */
    linkedArtistIds: z.array(z.string().uuid()).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.codes.includes("artist")) {
      const ids = data.linkedArtistIds?.filter(Boolean) ?? [];
      if (ids.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Пры ролі «артыст» абярыце хаця б адну карточку артыста лэйбла",
          path: ["linkedArtistIds"],
        });
      }
    }
  });

export type AdminUserRolesPatch = z.infer<typeof adminUserRolesPatchSchema>;
