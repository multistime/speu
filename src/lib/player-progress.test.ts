import { describe, expect, it } from "vitest";
import { formatPlayerTime } from "./format-player-time";

describe("formatPlayerTime", () => {
  it("formats zero", () => {
    expect(formatPlayerTime(0)).toBe("0:00");
  });

  it("pads seconds", () => {
    expect(formatPlayerTime(65)).toBe("1:05");
  });

  it("handles long tracks", () => {
    expect(formatPlayerTime(3725)).toBe("62:05");
  });

  it("guards NaN and negative", () => {
    expect(formatPlayerTime(NaN)).toBe("0:00");
    expect(formatPlayerTime(-1)).toBe("0:00");
  });
});

describe("clientXToSeekRatio", () => {
  it("maps click position to ratio", async () => {
    const { clientXToSeekRatio } = await import("./player-progress");
    const rect = { left: 100, width: 200 } as DOMRect;
    expect(clientXToSeekRatio(rect, 100)).toBe(0);
    expect(clientXToSeekRatio(rect, 200)).toBe(0.5);
    expect(clientXToSeekRatio(rect, 300)).toBe(1);
    expect(clientXToSeekRatio(rect, 50)).toBe(0);
    expect(clientXToSeekRatio(rect, 400)).toBe(1);
  });

  it("returns 0 for non-positive width", async () => {
    const { clientXToSeekRatio } = await import("./player-progress");
    const rect = { left: 0, width: 0 } as DOMRect;
    expect(clientXToSeekRatio(rect, 10)).toBe(0);
  });
});
