import type { ArtistPatternId } from "@/lib/artists/visual-theme";

export function ArtistPattern({ pattern, accent }: { pattern: ArtistPatternId; accent: string }) {
  const op = 0.12;
  switch (pattern) {
    case "fern":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none" preserveAspectRatio="xMidYMid slice">
          {[0, 40, 80, 120, 160].map((x) =>
            [0, 40, 80, 120, 160].map((y) => (
              <g key={`${x}-${y}`} transform={`translate(${x + 10},${y + 10})`}>
                <path d="M10 0 Q10 10 0 20 Q10 10 20 20 Q10 10 10 0" stroke={accent} strokeWidth="0.6" opacity={op} fill="none" />
              </g>
            ))
          )}
        </svg>
      );
    case "waves":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none" preserveAspectRatio="xMidYMid slice">
          {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((y) => (
            <path key={y} d={`M0 ${y} Q50 ${y - 10} 100 ${y} Q150 ${y + 10} 200 ${y}`} stroke={accent} strokeWidth="0.7" opacity={op} />
          ))}
        </svg>
      );
    case "circles":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none" preserveAspectRatio="xMidYMid slice">
          {[20, 50, 80, 110, 140, 170].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} stroke={accent} strokeWidth="0.8" opacity={op} />
          ))}
        </svg>
      );
    case "grid":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none" preserveAspectRatio="xMidYMid slice">
          {[0, 25, 50, 75, 100, 125, 150, 175, 200].map((v) => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="200" stroke={accent} strokeWidth="0.5" opacity={op} />
              <line x1="0" y1={v} x2="200" y2={v} stroke={accent} strokeWidth="0.5" opacity={op} />
            </g>
          ))}
        </svg>
      );
    case "spiral":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M100 100 Q120 80 130 100 Q140 130 100 140 Q60 150 50 100 Q40 50 100 40 Q160 30 170 100 Q180 170 100 180" stroke={accent} strokeWidth="0.8" opacity={op} />
          <path d="M100 100 Q110 90 115 100 Q120 115 100 120 Q80 125 75 100 Q70 75 100 70" stroke={accent} strokeWidth="0.6" opacity={op} />
        </svg>
      );
    case "diamond":
    default:
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none" preserveAspectRatio="xMidYMid slice">
          {[0, 50, 100, 150].map((x) =>
            [0, 50, 100, 150].map((y) => (
              <path key={`${x}-${y}`} d={`M${x + 25} ${y} L${x + 50} ${y + 25} L${x + 25} ${y + 50} L${x} ${y + 25}Z`}
                stroke={accent} strokeWidth="0.6" opacity={op} />
            ))
          )}
        </svg>
      );
  }
}
