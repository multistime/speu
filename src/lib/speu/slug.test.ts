import { describe, expect, it } from "vitest";
import { normalizeManualSlugInput, slugifyTitle } from "./slug";

describe("slugifyTitle", () => {
  it("transliterates Belarusian title", () => {
    expect(slugifyTitle("Вясновая песня")).toBe("vyasnovaya-pesnya");
  });

  it("keeps latin and digits", () => {
    expect(slugifyTitle("Track #2 (live)")).toBe("track-2-live");
  });

  it("falls back when empty after strip", () => {
    expect(slugifyTitle("@@@")).toBe("item");
  });
});

describe("normalizeManualSlugInput", () => {
  it("returns null for empty", () => {
    expect(normalizeManualSlugInput("")).toBeNull();
    expect(normalizeManualSlugInput("   ")).toBeNull();
    expect(normalizeManualSlugInput(null)).toBeNull();
  });

  it("uses same rules as title for Cyrillic", () => {
    expect(normalizeManualSlugInput("  Вясна  ")).toBe("vyasna");
  });

  it("keeps latin slug", () => {
    expect(normalizeManualSlugInput("live-in-Minsk")).toBe("live-in-minsk");
  });
});
