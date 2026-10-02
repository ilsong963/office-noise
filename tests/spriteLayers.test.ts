import { describe, expect, it } from 'vitest'
import { spriteLayers } from '../src/scene/spriteLayers'
import { spriteFrame } from '../src/scene/spriteTimeline'
import type { PersonalEvent } from '../src/audio/types'

describe('stationary scene during typing', () => {
  const event: PersonalEvent = { id: 1, kind: 'keyboard', startedAt: 0, duration: 5, soundOffset: .55, soundDuration: 4 }
  it('holds the furniture and body still throughout approach, typing and return', () => {
    const fingers = new Set<number | undefined>()
    for (let elapsed = 0; elapsed < event.duration; elapsed += .013) {
      const layers = spriteLayers(spriteFrame(event, elapsed, true))
      expect(layers.scene).toBe(0)
      if (elapsed >= event.soundOffset && elapsed < event.soundOffset + event.soundDuration) {
        expect(layers.hand).toBe(2)
        fingers.add(layers.fingers)
      }
    }
    expect([...fingers]).toContain(3)
    expect([...fingers]).toContain(undefined)
  })
  it('removes hand overlays when animation is disabled or playback ends', () => {
    for (const frame of [spriteFrame(event, 1, false), spriteFrame(undefined, 1, true), spriteFrame(event, 5, true)]) {
      expect(spriteLayers(frame)).toEqual({ scene: 0, hand: undefined, fingers: undefined })
    }
  })
  it('preserves mouse and sigh poses without typing overlays', () => {
    for (const frame of [4, 5, 6, 7]) expect(spriteLayers(frame)).toEqual({ scene: frame, hand: undefined, fingers: undefined })
  })
})
