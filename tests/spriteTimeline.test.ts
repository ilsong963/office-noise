import { describe, expect, it } from 'vitest'
import { spriteFrame } from '../src/scene/spriteTimeline'
import type { PersonalEvent } from '../src/audio/types'
const typing: PersonalEvent = { id: 1, kind: 'keyboard', startedAt: 0, duration: 4.55, soundOffset: .55, soundDuration: 3.5 }
describe('pose sequence without deformation', () => {
  it('prepares the fingers before the first keyboard sound', () => {
    expect(spriteFrame(typing, 0, true)).toBe(0)
    expect(spriteFrame(typing, .2, true)).toBe(1)
    expect(spriteFrame(typing, .54, true)).toBe(1)
    expect(spriteFrame(typing, .55, true)).toBe(2)
  })
  it('keeps the fingers in typing poses while typing audio plays', () => {
    for (let t = typing.soundOffset; t < typing.soundOffset + typing.soundDuration; t += .013) expect([2, 3]).toContain(spriteFrame(typing, t, true))
  })
  it('returns the fingers to rest only after typing ends', () => {
    expect(spriteFrame(typing, 4.1, true)).toBe(1)
    expect(spriteFrame(typing, 4.45, true)).toBe(0)
  })
  it('uses separate mouse poses and never typing poses during a mouse event', () => {
    const mouse = { ...typing, kind: 'mouse' as const, duration: 1.55, soundDuration: .35 }
    expect(spriteFrame(mouse, .3, true)).toBe(4)
    expect(spriteFrame(mouse, .65, true)).toBe(5)
    for (let t = 0; t < mouse.duration; t += .03) expect([0, 4, 5]).toContain(spriteFrame(mouse, t, true))
  })
  it('rests when paused, reduced-motion is selected, or the event finishes', () => {
    expect(spriteFrame(undefined, 1, true)).toBe(0)
    expect(spriteFrame(typing, 1, false)).toBe(0)
    expect(spriteFrame(typing, typing.duration, true)).toBe(0)
  })
})
