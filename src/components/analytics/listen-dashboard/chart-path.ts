/** SVG path through points using Catmull–Rom converted to cubic Bézier segments. */

export type ChartPoint = { x: number; y: number };

export function smoothLineThroughPoints(pts: ChartPoint[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (n === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < n - 2 ? pts[i + 2] : pts[i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Closed path: smooth top edge from pts, then baseline corners. */
export function smoothAreaPath(pts: ChartPoint[], bottomY: number): string {
  const line = smoothLineThroughPoints(pts);
  if (!line || pts.length === 0) return "";
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
}
