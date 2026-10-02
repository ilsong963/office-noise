import { afterEach, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import App from '../src/App'

afterEach(() => vi.unstubAllGlobals())
it.each([null, JSON.stringify({ characterMotion: false })])('does not silently disable event sprites on a fresh origin or with legacy preferences: %s', raw => {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
  vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'office-noise:mix:v1' ? raw : null })
  const html = renderToString(createElement(App))
  // Before the atlas loads the scene is a fallback, never a motion-disabled scene.
  expect(html).toContain('data-motion="fallback"')
  expect(html).not.toContain('data-motion="reduced"')
})
