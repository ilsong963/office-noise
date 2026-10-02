import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TypingHands from '../src/scene/TypingHands'
import { spriteLayers } from '../src/scene/spriteLayers'
import { spriteFrame } from '../src/scene/spriteTimeline'
import type { PersonalEvent } from '../src/audio/types'

const renderPose = (pose: 0 | 1 | 2 | 3) => renderToStaticMarkup(createElement(TypingHands, { pose }))
const handPath = (html: string, side: string) => html.match(new RegExp(`class="office-hand-${side}" d="([^"]+)"`))![1]
const deskMarkup = (html: string) => html.slice(html.indexOf('<g class="office-typing-desk"'), html.indexOf('class="office-hand-left"'))

describe('stationary keyboard with complete hands', () => {
  const event: PersonalEvent = { id: 1, kind: 'keyboard', startedAt: 0, duration: 5, soundOffset: .55, soundDuration: 4 }
  it('holds the scene still throughout approach, typing and return', () => {
    const hands = new Set<number | undefined>()
    for (let elapsed = 0; elapsed < event.duration; elapsed += .013) {
      const layers = spriteLayers(spriteFrame(event, elapsed, true))
      expect(layers.scene).toBe(0)
      if (elapsed >= event.soundOffset && elapsed < event.soundOffset + event.soundDuration) {
        expect([2, 3]).toContain(layers.hands)
        hands.add(layers.hands)
      }
    }
    expect([...hands].sort()).toEqual([2, 3])
  })
  it('returns the complete hands to rest when disabled or playback ends', () => {
    for (const frame of [spriteFrame(event, 1, false), spriteFrame(undefined, 1, true), spriteFrame(event, 5, true)]) {
      expect(spriteLayers(frame)).toEqual({ scene: 0, hands: 0 })
    }
  })
  it('preserves mouse and sigh poses without typing overlays', () => {
    for (const frame of [4, 5, 6, 7]) expect(spriteLayers(frame)).toEqual({ scene: frame, hands: undefined })
  })
  it('renders identical keyboard and desk geometry in every hand pose', () => {
    for (const pose of [1, 2, 3] as const) expect(deskMarkup(renderPose(pose))).toBe(deskMarkup(renderPose(0)))
  })
  it('changes both complete hand silhouettes without clipping or translating keyboard pixels', () => {
    const a = renderPose(2), b = renderPose(3)
    for (const side of ['left', 'right']) {
      expect(handPath(a, side)).not.toBe(handPath(b, side))
      expect(handPath(a, side)).toMatch(/ Z$/)
      expect(handPath(b, side)).toMatch(/ Z$/)
    }
    for (const html of [a, b]) expect(html).not.toMatch(/clip-path|clipPath|<image|transform=/)
  })
})
