import { describe, expect, it } from "vitest";
import { adminSongPayloadSchema, adminUserRolesPatchSchema } from "./api-schemas";

const sampleUuid = "550e8400-e29b-41d4-a716-446655440000";
const otherUuid = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("adminSongPayloadSchema", () => {
  it("accepts minimal create payload with one artist", () => {
    const r = adminSongPayloadSchema.safeParse({
      artistIds: [sampleUuid],
      title: "Песня",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sortOrder).toBe(0);
      expect(r.data.isPublished).toBe(true);
      expect(r.data.playOnRadio).toBe(false);
    }
  });

  it("rejects empty artistIds", () => {
    const r = adminSongPayloadSchema.safeParse({
      artistIds: [],
      title: "X",
    });
    expect(r.success).toBe(false);
  });

  it("accepts multi-artist order (credits)", () => {
    const r = adminSongPayloadSchema.safeParse({
      artistIds: [sampleUuid, otherUuid],
      title: "Feat",
      playOnRadio: true,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.artistIds).toEqual([sampleUuid, otherUuid]);
      expect(r.data.playOnRadio).toBe(true);
    }
  });

  it("rejects invalid uuid in artistIds", () => {
    const r = adminSongPayloadSchema.safeParse({
      artistIds: ["not-a-uuid"],
      title: "X",
    });
    expect(r.success).toBe(false);
  });
});

describe("adminUserRolesPatchSchema", () => {
  it("accepts listener without linkedArtistId", () => {
    const r = adminUserRolesPatchSchema.safeParse({ codes: ["listener"] });
    expect(r.success).toBe(true);
  });

  it("requires linkedArtistId when artist role is set", () => {
    const r = adminUserRolesPatchSchema.safeParse({ codes: ["artist"] });
    expect(r.success).toBe(false);
  });

  it("accepts artist with linkedArtistId", () => {
    const r = adminUserRolesPatchSchema.safeParse({
      codes: ["listener", "artist"],
      linkedArtistId: sampleUuid,
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown role codes", () => {
    const r = adminUserRolesPatchSchema.safeParse({
      codes: ["owner"],
    });
    expect(r.success).toBe(false);
  });
});
