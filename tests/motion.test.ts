import { afterEach, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import App from '../src/App'

afterEach(() => vi.unstubAllGlobals())
it.each([null, JSON.stringify({ animationEnabled: false }), JSON.stringify({ animationEnabled: true })])('renders an idle character and the animation switch before playback: %s', raw => {
  vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'office-noise:mix:v1' ? raw : null })
  const html = renderToString(createElement(App))
  expect(html).toContain('data-personal-action="idle"')
  expect(html).toContain('data-sprite-frame="idle"')
  expect(html).toContain('aria-label="애니메이션"')
  expect(html).not.toContain('캐릭터 소리')
})
