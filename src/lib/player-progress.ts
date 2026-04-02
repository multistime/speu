/** Адліку clientX да долі 0…1 па прамавугольніку рэйкі (для тэстаў і плэера). */
export function clientXToSeekRatio(rect: DOMRect, clientX: number): number {
  if (rect.width <= 0) return 0;
  return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
}
