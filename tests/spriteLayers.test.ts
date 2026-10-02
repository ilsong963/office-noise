import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TypingHands, { typingHandParts } from '../src/scene/TypingHands'
import { spriteLayers } from '../src/scene/spriteLayers'
import { spriteFrame } from '../src/scene/spriteTimeline'
import type { PersonalEvent } from '../src/audio/types'

const renderPose = (pose: 0 | 1 | 2 | 3) => renderToStaticMarkup(createElement(TypingHands, { pose }))
const handPath = (html: string, side: string) => html.match(new RegExp(`class="office-hand-${side}" d="([^"]+)"`))![1]
const deskMarkup = (html: string) => html.slice(html.indexOf('<g class="office-typing-desk"'), html.indexOf('class="office-hand-right"'))

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
  it('shows exactly one connected right hand without cropping', () => {
    for (const pose of [0, 1, 2, 3] as const) {
      const html = renderPose(pose)
      expect(html.match(/class="office-hand-right"/g)).toHaveLength(1)
      expect(html).not.toContain('office-hand-left')
      expect(handPath(html, 'right')).toMatch(/ Z$/)
      expect(html).not.toMatch(/clip-path|clipPath|<image|transform=/)
    }
  })
  it('moves all four fingers while keeping thumb, palm and wrist unchanged', () => {
    const a = typingHandParts(2), b = typingHandParts(3)
    expect(a.fingers).toHaveLength(4)
    a.fingers.forEach((finger, index) => expect(finger).not.toBe(b.fingers[index]))
    for (const pose of [1, 2, 3] as const) {
      const parts = typingHandParts(pose), rest = typingHandParts(0)
      expect(parts.thumb).toBe(rest.thumb)
      expect(parts.palm).toBe(rest.palm)
    }
  })
})
