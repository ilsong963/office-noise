// Keep the scene registered while swapping only the working hand/forearm.
// Coordinates are percentages of one square atlas cell, shared by all hairstyles.
export const keyboardHandClip = 'polygon(55% 36%, 66% 36%, 66% 46%, 63% 47%, 60% 52.5%, 54% 52.5%, 53% 46%, 55% 44%)'
export const typingFingersClip = 'polygon(56.5% 40%, 60% 39.5%, 64.5% 40%, 65.5% 44.3%, 62% 47%, 58% 47%, 57% 44%)'
// The upper atlas row is lifted by 0.45% of a cell (about 1–2px on screen).
// Only the clipped hand pixels move; neither the source image nor body is scaled.
export const typingFingersPosition = '100% 0.45%'

export function spriteLayers(frame: number) {
  const keyboard = frame >= 1 && frame <= 3
  return {
    scene: keyboard ? 0 : frame,
    hand: keyboard ? (frame === 1 ? 1 : 2) : undefined,
    fingers: frame === 3 ? 3 : undefined,
  }
}

export function spritePosition(cell: number) {
  return `${cell % 4 / 3 * 100}% ${Math.floor(cell / 4) * 100}%`
}
