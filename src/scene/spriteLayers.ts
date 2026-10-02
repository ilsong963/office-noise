export function spriteLayers(frame: number) {
  const typing = frame >= 0 && frame <= 3
  return {
    scene: typing ? 0 : frame,
    hands: typing ? frame as 0 | 1 | 2 | 3 : undefined,
  }
}

export function spritePosition(cell: number) {
  return `${cell % 4 / 3 * 100}% ${Math.floor(cell / 4) * 100}%`
}
