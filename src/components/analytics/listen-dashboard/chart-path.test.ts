import { describe, expect, it } from "vitest";
import { smoothAreaPath, smoothLineThroughPoints } from "./chart-path";

describe("smoothLineThroughPoints", () => {
  it("returns empty string for no points", () => {
    expect(smoothLineThroughPoints([])).toBe("");
  });

  it("uses move only for a single point", () => {
    expect(smoothLineThroughPoints([{ x: 3, y: 4 }])).toBe("M 3 4");
  });

  it("uses line for two points", () => {
    expect(smoothLineThroughPoints([
      { x: 0, y: 10 },
      { x: 100, y: 20 },
    ])).toBe("M 0 10 L 100 20");
  });

  it("uses cubic segments for three or more points", () => {
    const d = smoothLineThroughPoints([
      { x: 0, y: 50 },
      { x: 50, y: 10 },
      { x: 100, y: 50 },
    ]);
    expect(d.startsWith("M 0 50")).toBe(true);
    expect(d.includes(" C ")).toBe(true);
    expect(d.endsWith("100 50")).toBe(true);
  });
});

describe("smoothAreaPath", () => {
  it("returns empty when no points", () => {
    expect(smoothAreaPath([], 100)).toBe("");
  });

  it("closes along baseline", () => {
    const d = smoothAreaPath(
      [
        { x: 0, y: 10 },
        { x: 50, y: 5 },
        { x: 100, y: 10 },
      ],
      40,
    );
    expect(d).toMatch(/L 100 40 L 0 40 Z$/);
  });
});
