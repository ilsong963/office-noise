import { afterEach, expect, it, vi } from 'vitest'
import { OfficeEngine } from '../src/audio/OfficeEngine'
import { categories } from '../src/data/sounds'
import { defaults } from '../src/data/settings'

class Param { value = 0; setValueAtTime() {} linearRampToValueAtTime() {} setTargetAtTime() {} cancelAndHoldAtTime() {} }
class Node { gain = new Param(); pan = new Param(); threshold = new Param(); knee = new Param(); ratio = new Param(); attack = new Param(); release = new Param(); connect(node: Node) { return node } disconnect() {} }
class Source extends Node {
  buffer: unknown; onended: (() => void) | null = null; timer?: ReturnType<typeof setTimeout>
  start(when: number, _offset: number, duration: number) { this.timer = setTimeout(() => this.onended?.(), (Math.max(0, when - Date.now() / 1000) + duration) * 1000) }
  stop() { clearTimeout(this.timer); this.onended?.() }
}
class Context {
  destination = new Node(); state = 'running'; onstatechange: (() => void) | null = null
  get currentTime() { return Date.now() / 1000 }
  createGain() { return new Node() } createDynamicsCompressor() { return new Node() } createStereoPanner() { return new Node() } createBufferSource() { return new Source() }
  async resume() { this.state = 'running' } async suspend() { this.state = 'suspended' } async close() { this.state = 'closed' }
  async decodeAudioData(data: ArrayBuffer) { const duration = new Float64Array(data)[0]; return { duration, length: duration * 22050, numberOfChannels: 1 } }
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })
it('keeps natural overlap in the default mix without overcrowding or overlapping prominent effects', async () => {
  vi.useFakeTimers(); vi.stubGlobal('AudioContext', Context)
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const file = categories.flatMap(c => c.soundFiles).find(f => url.endsWith(f.file))!
    return { ok: true, arrayBuffer: async () => new Float64Array([file.duration]).buffer }
  }))
  const stats = []
  for (const seed of [11, 37, 97, 151, 331]) {
    let random = seed
    vi.spyOn(Math, 'random').mockImplementation(() => { random = (1664525 * random + 1013904223) >>> 0; return random / 2 ** 32 })
    let last = Date.now(), count = 0, overlapMs = 0, silenceMs = 0, max = 0, prominentMax = 0
    const update = (now: number) => { if (count >= 2) overlapMs += now - last; if (count === 0) silenceMs += now - last; last = now }
    const engine = new OfficeEngine(categories, { ...defaults(), personalEvents: false }, state => {
      update(Date.now()); count = state.active.length; max = Math.max(max, count)
      prominentMax = Math.max(prominentMax, categories.filter(c => c.prominent && state.active.includes(c.id)).length)
    })
    await engine.start(); await vi.advanceTimersByTimeAsync(600000); update(Date.now())
    stats.push({ seed, overlap: +(overlapMs / 600000).toFixed(3), silence: +(silenceMs / 600000).toFixed(3), max })
    expect(max).toBeLessThanOrEqual(4); expect(prominentMax).toBeLessThanOrEqual(1)
    engine.dispose(); await vi.advanceTimersByTimeAsync(100)
  }
  console.info('10-minute default mix overlap:', JSON.stringify(stats))
  // Verify overlap is sustained over a session, rather than merely one coincidental event.
  for (const result of stats) {
    expect(result.overlap).toBeGreaterThan(0.2)
    expect(result.overlap).toBeLessThan(0.45)
    expect(result.silence).toBeGreaterThan(0.08)
  }
})
