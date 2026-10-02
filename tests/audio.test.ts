import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { OfficeEngine } from '../src/audio/OfficeEngine'
import { canPlay, chooseFile, naturalDelay } from '../src/audio/random'
import { categories } from '../src/data/sounds'
import { restore } from '../src/data/settings'
import type { EngineState, SoundCategory } from '../src/audio/types'

class Param { value = 0; setValueAtTime() {} linearRampToValueAtTime() {} setTargetAtTime() {} cancelAndHoldAtTime() {} }
class Node { gain = new Param(); pan = new Param(); threshold = new Param(); knee = new Param(); ratio = new Param(); attack = new Param(); release = new Param(); connect(node: Node) { return node } disconnect() {} }
class Source extends Node {
  buffer: unknown; onended: (() => void) | null = null; timer?: ReturnType<typeof setTimeout>
  start(_when: number, _offset: number, duration: number) { starts++; this.timer = setTimeout(() => this.onended?.(), Math.max(0, _when - Date.now() / 1000) * 1000 + duration * 1000) }
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
  it('discards obsolete ambient and character loads after a category is disabled and enabled', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
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
    // Keep the character's second fetch after the initial error observation.
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
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
describe('office occupancy', () => {
  it('restores and bounds saved occupancy, including older settings', () => {
    expect(restore(null).officePeople).toBe(4)
    expect(restore('{"officePeople":6}').officePeople).toBe(6)
    expect(restore('{"officePeople":0}').officePeople).toBe(1)
    expect(restore('{"officePeople":99}').officePeople).toBe(8)
    expect(restore('{"officePeople":2.7}').officePeople).toBe(3)
    expect(restore('{"officePeople":"bad"}').officePeople).toBe(4)
  })
  it('caps active sounds immediately when reducing occupancy, including pending schedules', async () => {
    const list = Array.from({ length: 8 }, (_, i) => ({ ...small, id: `desk-${i}`, densityCost: .6, initialDelay: [.01, .01] as [number, number] }))
    const mix = { master: .5, officePeople: 8, channels: Object.fromEntries(list.map(c => [c.id, { enabled: true, volume: .5 }])) }
    let active = 0, observedLimit = 8, maxAfter = 0
    engine = new OfficeEngine(list, mix, state => {
      active = state.active.length
      if (observedLimit === 1) maxAfter = Math.max(maxAfter, active)
    })
    await engine.start(); await vi.advanceTimersByTimeAsync(100)
    expect(active).toBe(8)
    observedLimit = 1
    engine.update({ ...mix, officePeople: 1 })
    expect(active).toBe(1)
    await vi.advanceTimersByTimeAsync(30000)
    expect(maxAfter).toBe(1)
  })
  it('lets a solo office play a strong effect without increasing their overlap', () => {
    const printer = categories.find(c => c.id === 'printer')!
    expect(canPlay(printer, [], 100, 0, 1)).toBe(true)
    expect(canPlay(small, [printer], 100, 0, 1)).toBe(false)
    expect(canPlay({ ...printer, id: 'other-printer' }, [printer], 100, 0, 8)).toBe(false)
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


describe('animation follows playback', () => {
  const quiet = { ...small, initialDelay: [100, 100] as [number, number] }
  it.each([true, false])('stays still before playback when animation is %s', async animationEnabled => {
    const events = new Set<number>()
    engine = new OfficeEngine([quiet], { ...settings, animationEnabled }, s => { if (s.personal) events.add(s.personal.id) })
    engine.update({ ...settings, animationEnabled: !animationEnabled })
    await vi.advanceTimersByTimeAsync(30000)
    expect(events.size).toBe(0); expect(starts).toBe(0); expect(fetch).not.toHaveBeenCalled()
  })
  it('plays sounds while keeping the character still when OFF', async () => {
    const events = new Set<number>()
    engine = new OfficeEngine([small], { ...settings, animationEnabled: false }, s => { if (s.personal) events.add(s.personal.id) })
    await engine.start(); await vi.advanceTimersByTimeAsync(30000)
    expect(events.size).toBe(0); expect(starts).toBeGreaterThan(10)
  })
  it('synchronizes movement with the real sound after playback starts', async () => {
    let state: EngineState | undefined
    engine = new OfficeEngine([quiet], settings, s => { state = s })
    await engine.start(); await vi.advanceTimersByTimeAsync(1200)
    expect(starts).toBe(1)
    expect(state?.personal).toMatchObject({ kind: 'keyboard', soundOffset: .55, soundDuration: .5, duration: 1.55 })
    expect(state?.active).toEqual(['keyboard'])
  })
  it('switches only the visual state mid-action without interrupting audio', async () => {
    let state: EngineState | undefined
    engine = new OfficeEngine([quiet], settings, s => { state = s })
    await engine.start(); await vi.advanceTimersByTimeAsync(1200)
    const event = state?.personal
    engine.update({ ...settings, animationEnabled: false })
    expect(state?.personal).toBeUndefined(); expect(state?.active).toEqual(['keyboard'])
    expect(state?.playing).toBe(true); expect(starts).toBe(1)
    engine.update({ ...settings, animationEnabled: true })
    expect(state?.personal).toBe(event); expect(starts).toBe(1)
  })
  it.each([true, false])('stops all motion on pause and only resumes with playback, preference %s', async animationEnabled => {
    let state: EngineState | undefined
    const events = new Set<number>()
    engine = new OfficeEngine([quiet], { ...settings, animationEnabled }, s => { state = s; if (s.personal) events.add(s.personal.id) })
    await engine.start(); await vi.advanceTimersByTimeAsync(1200)
    engine.pause()
    expect(state?.personal).toBeUndefined(); expect(state?.active).toEqual([])
    const before = starts, eventCount = events.size
    engine.update({ ...settings, animationEnabled: true })
    await vi.advanceTimersByTimeAsync(30000)
    expect(starts).toBe(before); expect(events.size).toBe(eventCount)
    expect(state?.playing).toBe(false); expect(state?.personal).toBeUndefined()
    await engine.start(); await vi.advanceTimersByTimeAsync(1200)
    expect(state?.personal).toBeDefined(); expect(state?.playing).toBe(true)
  })
  it('does not animate a late character download after animation OFF, while audio continues', async () => {
    let finish!: (value: unknown) => void
    vi.stubGlobal('fetch', () => new Promise(resolve => { finish = resolve }))
    let state: EngineState | undefined
    engine = new OfficeEngine([quiet], settings, s => { state = s })
    await engine.start(); await vi.advanceTimersByTimeAsync(1200)
    engine.update({ ...settings, animationEnabled: false })
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    await vi.advanceTimersByTimeAsync(1)
    expect(starts).toBe(1); expect(state?.personal).toBeUndefined()
  })
  it('cancels a pending character event after pause', async () => {
    let finish!: (value: unknown) => void
    vi.stubGlobal('fetch', () => new Promise(resolve => { finish = resolve }))
    let state: EngineState | undefined
    engine = new OfficeEngine([quiet], settings, s => { state = s })
    await engine.start(); await vi.advanceTimersByTimeAsync(1200); engine.pause()
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    await vi.advanceTimersByTimeAsync(30000)
    expect(starts).toBe(0); expect(state?.personal).toBeUndefined()
  })
  it('disposes pending character work without another sound or animation', async () => {
    let finish!: (value: unknown) => void
    vi.stubGlobal('fetch', () => new Promise(resolve => { finish = resolve }))
    const notify = vi.fn()
    engine = new OfficeEngine([quiet], settings, notify)
    await engine.start(); await vi.advanceTimersByTimeAsync(1200)
    engine.dispose(); const calls = notify.mock.calls.length
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    await vi.advanceTimersByTimeAsync(30000)
    expect(starts).toBe(0); expect(notify).toHaveBeenCalledTimes(calls)
    engine = undefined
  })
  it('persists the new animation choice without importing the removed sound preference', () => {
    expect(restore('{"animationEnabled":false}').animationEnabled).toBe(false)
    expect(restore('{"personalEvents":false,"characterMotion":false}').animationEnabled).toBe(true)
  })
})
