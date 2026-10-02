import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import OfficeScene from '../src/scene/OfficeScene'
import { characters } from '../src/data/characters'
import { spritePosition } from '../src/scene/spriteAtlas'
import { spriteNames } from '../src/scene/spriteTimeline'

describe('complete character sprite atlases', () => {
  it.each(characters)('$id has a real PNG atlas with square cells in a 4 × 2 layout', character => {
    const png = readFileSync(new URL(`../public/assets/${character.asset}`, import.meta.url))
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
    expect(width).toBe(height * 2)
    expect(height).toBeGreaterThanOrEqual(800)
  })
  it('maps all eight timeline poses to distinct cells inside the atlas', () => {
    const positions = spriteNames.map((_, cell) => spritePosition(cell))
    expect(new Set(positions).size).toBe(8)
    expect(positions[0]).toBe('0% 0%')
    expect(positions[7]).toBe('100% 100%')
  })
  it('renders one complete scene without reconstructed hands or keyboard overlays', () => {
    const html = renderToStaticMarkup(createElement(OfficeScene, { motionEnabled: true, character: 'male-sparse' }))
    expect(html.match(/class="office-sprite-pose office-sprite-body"/g)).toHaveLength(1)
    expect(html).toContain('data-sprite-frame="idle"')
    expect(html).toContain('office-male-sparse-v5.png')
    expect(html).not.toMatch(/<svg|office-hand|clip-path|clipPath/)
  })
})
