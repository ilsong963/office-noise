import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { OfficeEngine } from '../src/audio/OfficeEngine'
import { canBecomePersonal } from '../src/audio/personalEvents'
import { canPlay, chooseFile, naturalDelay } from '../src/audio/random'
import { categories } from '../src/data/sounds'
import { restore } from '../src/data/settings'
import type { EngineState, SoundCategory } from '../src/audio/types'

class Param { value = 0; setValueAtTime() {} linearRampToValueAtTime() {} setTargetAtTime() {} cancelAndHoldAtTime() {} }
class Node { gain = new Param(); pan = new Param(); threshold = new Param(); knee = new Param(); ratio = new Param(); attack = new Param(); release = new Param(); connect(node: Node) { return node } disconnect() {} }
class Source extends Node {
  buffer: unknown; onended: (() => void) | null = null; timer?: ReturnType<typeof setTimeout>
  start(_when: number, _offset: number, duration: number) { starts++; this.timer = setTimeout(() => this.onended?.(), duration * 1000) }
  stop() { clearTimeout(this.timer); this.onended?.() }
}
let starts = 0
let suspends = 0
class Context {
  destination = new Node(); state = 'running'; onstatechange: (() => void) | null = null
  get currentTime() { return Date.now() / 1000 }
  createGain() { return new Node() } createDynamicsCompressor() { return new Node() } createStereoPanner() { return new Node() } createBufferSource() { return new Source() }
  async resume() { this.state = 'running' } async suspend() { suspends++; this.state = 'suspended' } async close() { this.state = 'closed' }
  async decodeAudioData() { return { duration: .5, length: 22050, numberOfChannels: 1 } }
}
const small: SoundCategory = { ...categories[0], soundFiles: [{ file: 'test.wav', gain: .2, duration: .5 }], minInterval: .2, maxInterval: .6, burst: undefined }
const settings = { master: .5, channels: { keyboard: { enabled: true, volume: .7 } } }
let engine: OfficeEngine | undefined
beforeEach(() => { starts = 0; suspends = 0; vi.useFakeTimers(); vi.stubGlobal('AudioContext', Context); vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })) })
afterEach(() => { engine?.dispose(); engine = undefined; vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('playback lifecycle', () => {
  it('does not play a late download after pause', async () => {
    let finish!: (value: unknown) => void
    vi.stubGlobal('fetch', () => new Promise(resolve => { finish = resolve }))
    engine = new OfficeEngine([small], settings, () => {})
    await engine.start(); await vi.advanceTimersByTimeAsync(800); engine.pause()
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    await vi.advanceTimersByTimeAsync(1000)
    expect(starts).toBe(0)
  })
  it('discards obsolete loads after a category is disabled and enabled', async () => {
    let finish!: (value: unknown) => void
    vi.stubGlobal('fetch', () => new Promise(resolve => { finish = resolve }))
    engine = new OfficeEngine([small], settings, () => {})
    await engine.start(); await vi.advanceTimersByTimeAsync(800)
    engine.update({ ...settings, channels: { keyboard: { enabled: false, volume: .7 } } })
    engine.update(settings)
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    await vi.advanceTimersByTimeAsync(1)
    expect(starts).toBe(0)
  })
  it('stops every schedule on pause and resumes without catch-up', async () => {
    let state: EngineState | undefined
    engine = new OfficeEngine([small], settings, s => { state = s })
    await engine.start(); await vi.advanceTimersByTimeAsync(5000)
    expect(starts).toBeGreaterThan(1)
    engine.pause(); const before = starts
    await vi.advanceTimersByTimeAsync(120000)
    expect(starts).toBe(before); expect(state?.active).toEqual([])
    await engine.start(); await vi.advanceTimersByTimeAsync(800)
    expect(starts).toBe(before + 1)
  })
  it('retries a failed download and clears its visible error', async () => {
    let state: EngineState | undefined
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    engine = new OfficeEngine([small], settings, s => { state = s })
    await engine.start(); await vi.advanceTimersByTimeAsync(800)
    expect(state?.errors.keyboard).toBeTruthy()
    await vi.advanceTimersByTimeAsync(11000)
    expect(starts).toBeGreaterThan(0); expect(state?.errors.keyboard).toBeUndefined()
  })
  it('respects the 4-voice limit during a simulated ten-minute session', async () => {
    const list = Array.from({ length: 8 }, (_, i) => ({ ...small, densityCost: 0.6, id: i ? `channel-${i}` : 'keyboard' }))
    let max = 0
    engine = new OfficeEngine(list, { master: .5, channels: Object.fromEntries(list.map(c => [c.id, { enabled: true, volume: .5 }])) }, s => { max = Math.max(max, s.active.length) })
    await engine.start(); await vi.advanceTimersByTimeAsync(600000)
    expect(starts).toBeGreaterThan(100); expect(max).toBe(4)
  })
})
describe('natural mix and source inventory', () => {
  it('prevents consecutive duplicates and bounds random intervals', () => {
    let previous: string | undefined
    for (let i = 0; i < 1000; i++) { const file = chooseFile(categories[0].soundFiles, previous); expect(file.file).not.toBe(previous); previous = file.file; const delay = naturalDelay(5, 20); expect(delay).toBeGreaterThanOrEqual(5); expect(delay).toBeLessThanOrEqual(20) }
  })
  it('reserves space and quiet time for prominent effects', () => {
    const printer = categories.find(c => c.id === 'printer')!
    expect(canPlay(printer, [], 10, 20)).toBe(false)
    expect(canPlay(printer, [printer], 30, 20)).toBe(false)
    expect(canPlay(printer, [small, { ...small, id: 'other' }], 30, 20)).toBe(false)
    expect(canPlay(printer, [], 30, 20)).toBe(true)
  })
  it('allows quiet work sounds to overlap while preserving hard density limits', () => {
    const keyboard = categories.find(c => c.id === 'keyboard')!
    const mouse = categories.find(c => c.id === 'mouse')!
    const paper = categories.find(c => c.id === 'paper')!
    const pen = categories.find(c => c.id === 'pen')!
    const printer = categories.find(c => c.id === 'printer')!
    expect(canPlay(pen, [keyboard, mouse, paper], 100, 0)).toBe(true)
    expect(canPlay(mouse, [keyboard, printer], 100, 0)).toBe(true)
    expect(canPlay(paper, [keyboard, printer, mouse], 100, 0)).toBe(false)
    expect(canPlay(keyboard, [keyboard], 100, 0)).toBe(false)
  })
  it('includes every real file exactly once, with safe trim ranges and grouped variants', () => {
    const files = categories.flatMap(c => c.soundFiles)
    expect(files).toHaveLength(24); expect(new Set(files.map(f => f.file)).size).toBe(24)
    for (const f of files) { expect(existsSync(`public/assets/sounds/${f.file}`)).toBe(true); expect(f.trimEnd).toBeGreaterThan(f.trimStart ?? 0); expect(f.trimEnd).toBeLessThanOrEqual(f.duration); expect(f.gain).toBeGreaterThan(0) }
    expect(categories.find(c => c.id === 'water')?.soundFiles).toHaveLength(2)
    expect(categories.find(c => c.id === 'sigh')?.soundFiles).toHaveLength(4)
  })
  it('recovers malformed preferences and clamps out-of-range levels', () => {
    expect(restore('{oops').master).toBe(.65)
    const result = restore('{"master":999,"channels":{"keyboard":{"enabled":false,"volume":-3}}}')
    expect(result.master).toBe(1); expect(result.channels.keyboard).toEqual({ enabled: false, volume: 0 })
    expect(Object.keys(result.channels)).toHaveLength(categories.length)
  })
})


describe('occasional personal events', () => {
  it('keeps ordinary surrounding sounds still, including early keyboard sounds', async () => {
    const events: number[] = []
    engine = new OfficeEngine([small], settings, s => { if (s.personal) events.push(s.personal.id) })
    await engine.start(); await vi.advanceTimersByTimeAsync(15000)
    expect(starts).toBeGreaterThan(0); expect(events).toEqual([])
  })
  it('only assigns eligible sounds, after quiet time, and never overlaps actors', () => {
    expect(canBecomePersonal(small, 20, 30, false, () => 0)).toBe(false)
    expect(canBecomePersonal(small, 40, 30, true, () => 0)).toBe(false)
    expect(canBecomePersonal({ ...small, id: 'printer' }, 40, 30, false, () => 0)).toBe(false)
    expect(canBecomePersonal(small, 40, 30, false, () => 0)).toBe(true)
  })
  it('respects the opt-out while continuing background audio', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    let events = 0
    engine = new OfficeEngine([small], { ...settings, personalEvents: false }, s => { if (s.personal) events++ })
    await engine.start(); await vi.advanceTimersByTimeAsync(180000)
    expect(starts).toBeGreaterThan(10); expect(events).toBe(0)
  })
  it('leaves at least 65 seconds between personal events', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const seen = new Map<number, number>()
    engine = new OfficeEngine([small], settings, s => { if (s.personal && !seen.has(s.personal.id)) seen.set(s.personal.id, Date.now()) })
    await engine.start(); await vi.advanceTimersByTimeAsync(600000)
    const times = [...seen.values()]
    expect(times.length).toBeGreaterThan(1)
    for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(65000)
  })
  it('plays an isolated preview without the pause timer suspending its audio', async () => {
    let state: EngineState | undefined
    engine = new OfficeEngine([small], settings, s => { state = s })
    await engine.previewPersonal('keyboard')
    expect(state?.playing).toBe(false); expect(state?.personal?.kind).toBe('keyboard'); expect(starts).toBe(1)
    await vi.advanceTimersByTimeAsync(100)
    expect(suspends).toBe(0)
    engine.pause(); expect(state?.personal).toBeUndefined()
    await vi.advanceTimersByTimeAsync(10000); expect(starts).toBe(1)
  })
  it('cancels a pending personal preview when paused before download completion', async () => {
    let finish!: (value: unknown) => void
    vi.stubGlobal('fetch', () => new Promise(resolve => { finish = resolve }))
    engine = new OfficeEngine([small], settings, () => {})
    const request = engine.previewPersonal('keyboard')
    await vi.advanceTimersByTimeAsync(1); engine.pause()
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    await request; expect(starts).toBe(0)
  })
})
