"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

function noise(x: number, y: number, t: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const hash = (n: number) => {
    const s = Math.sin(n * 127.1 + t * 0.0003) * 43758.5453;
    return s - Math.floor(s);
  };

  const a = hash(ix + iy * 57);
  const b = hash(ix + 1 + iy * 57);
  const c = hash(ix + (iy + 1) * 57);
  const d = hash(ix + 1 + (iy + 1) * 57);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, t: number, octaves = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise(x * frequency, y * frequency, t);
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value;
}

function marchingSquaresContour(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  threshold: number,
  color: string,
  alpha: number
) {
  const scale = 0.004;
  const step = 12;

  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 0.6;
  ctx.beginPath();

  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < height; y += step) {
      const nx = x * scale;
      const ny = y * scale;

      const tl = fbm(nx, ny, t);
      const tr = fbm(nx + step * scale, ny, t);
      const bl = fbm(nx, ny + step * scale, t);
      const br = fbm(nx + step * scale, ny + step * scale, t);

      const above = (v: number) => v > threshold;
      const idx =
        (above(tl) ? 8 : 0) |
        (above(tr) ? 4 : 0) |
        (above(br) ? 2 : 0) |
        (above(bl) ? 1 : 0);

      if (idx === 0 || idx === 15) continue;

      const lerp = (a: number, b: number, v: number): number =>
        a + (b - a) * ((threshold - a) / (b - a) || 0.5);

      const top: Point = { x: x + lerp(tl, tr, threshold) * step, y };
      const right: Point = { x: x + step, y: y + lerp(tr, br, threshold) * step };
      const bottom: Point = { x: x + lerp(bl, br, threshold) * step, y: y + step };
      const left: Point = { x, y: y + lerp(tl, bl, threshold) * step };

      const segs: [Point, Point][] = [];
      switch (idx) {
        case 1: case 14: segs.push([left, bottom]); break;
        case 2: case 13: segs.push([bottom, right]); break;
        case 3: case 12: segs.push([left, right]); break;
        case 4: case 11: segs.push([top, right]); break;
        case 5: segs.push([top, left], [bottom, right]); break;
        case 6: case 9: segs.push([top, bottom]); break;
        case 7: case 8: segs.push([top, left]); break;
        case 10: segs.push([top, right], [bottom, left]); break;
      }
      for (const [a, b] of segs) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function TopographicCanvas({ isDark = true }: { isDark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  // Use a ref so the animation loop always reads the latest theme
  // without needing to restart the loop on theme change
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (isDarkRef.current) {
        // Dark: deep pine forest night
        const bg = ctx.createRadialGradient(
          width * 0.5, height * 0.4, 0,
          width * 0.5, height * 0.4, width * 0.8
        );
        bg.addColorStop(0, "rgba(14,28,22,0.95)");
        bg.addColorStop(0.5, "rgba(11,18,16,0.97)");
        bg.addColorStop(1, "rgba(6,10,8,1)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        const levels = [0.28, 0.34, 0.40, 0.46, 0.52, 0.58, 0.64, 0.70];
        levels.forEach((level, i) => {
          const progress = i / levels.length;
          const alpha = 0.08 + progress * 0.18;
          const green = Math.round(160 + progress * 62);
          marchingSquaresContour(ctx, width, height, t, level, `rgb(40,${green},70)`, alpha);
        });

        [0.55, 0.62].forEach((level, i) => {
          marchingSquaresContour(ctx, width, height, t * 0.7 + 50, level, `rgb(200,140,40)`, 0.04 + i * 0.04);
        });
      } else {
        // Light: warm linen daylight
        const bg = ctx.createRadialGradient(
          width * 0.5, height * 0.4, 0,
          width * 0.5, height * 0.4, width * 0.8
        );
        bg.addColorStop(0, "rgba(246,242,232,1)");
        bg.addColorStop(0.5, "rgba(242,237,224,1)");
        bg.addColorStop(1, "rgba(234,229,212,1)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        // Cornflower blue contour lines — subtle on light linen
        const levels = [0.28, 0.34, 0.40, 0.46, 0.52, 0.58, 0.64, 0.70];
        levels.forEach((level, i) => {
          const progress = i / levels.length;
          const alpha = 0.04 + progress * 0.10;
          marchingSquaresContour(ctx, width, height, t, level, `rgb(61,107,152)`, alpha);
        });

        // Kupalle amber accents (sparse)
        [0.55, 0.62].forEach((level, i) => {
          marchingSquaresContour(ctx, width, height, t * 0.7 + 50, level, `rgb(191,117,53)`, 0.025 + i * 0.025);
        });
      }

      t += 1;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden
    />
  );
}
