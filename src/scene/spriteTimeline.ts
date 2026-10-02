import type { PersonalEvent } from '../audio/types'

// Atlas order: idle, hand lifting over keys, typing A, typing B,
// mouse rest, mouse click, sigh inhale, sigh exhale. Each cell is a complete scene, with no hand overlays.
export const spriteNames = ['idle', 'reach-keyboard', 'typing-a', 'typing-b', 'mouse-rest', 'mouse-click', 'sigh-inhale', 'sigh-exhale'] as const

export function spriteFrame(event: PersonalEvent | undefined, elapsed: number, motionEnabled: boolean) {
  if (!event || !motionEnabled || elapsed < 0 || elapsed >= event.duration) return 0
  const lead = event.soundOffset
  const soundEnd = lead + event.soundDuration
  if (event.kind === 'keyboard') {
    if (elapsed < 0.14) return 0
    if (elapsed < lead) return 1
    if (elapsed < soundEnd) {
      // Uneven frame holds create finger strokes; this never schedules the audio.
      const cycle = (elapsed - lead) % 0.79
      if (cycle < 0.12) return 2
      if (cycle < 0.21) return 3
      if (cycle < 0.37) return 2
      if (cycle < 0.46) return 3
      if (cycle < 0.66) return 2
      return 3
    }
    return elapsed < soundEnd + 0.24 ? 1 : 0
  }
  if (event.kind === 'mouse') {
    if (elapsed < 0.16) return 0
    if (elapsed < lead) return 4
    if (elapsed < soundEnd + 0.14) return 5
    return elapsed < event.duration - 0.18 ? 4 : 0
  }
  const progress = elapsed / event.duration
  return progress < 0.1 ? 0 : progress < 0.43 ? 6 : progress < 0.88 ? 7 : 0
}
