// Complete 4 × 2 scenes share the same viewport; only the selected cell changes.
export function spritePosition(cell: number) {
  return `${cell % 4 / 3 * 100}% ${Math.floor(cell / 4) * 100}%`
}
