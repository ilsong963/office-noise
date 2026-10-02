import { canBecomePersonal } from './personalEvents'
import { soundUrl } from './soundUrl'
import { MASTER_BOOST } from './levels'
import { between, canPlay, chooseFile, naturalDelay } from './random'
import type { EngineState, MixerSettings, PersonalAction, PersonalEvent, SoundCategory, SoundFile } from './types'

type Voice = { source: AudioBufferSourceNode; gain: GainNode; pan: StereoPannerNode; category: SoundCategory; personal?: PersonalEvent; tailTimer?: ReturnType<typeof setTimeout> }

export class OfficeEngine {
  private context?: AudioContext
  private master?: GainNode
  private compressor?: DynamicsCompressorNode
  private channelGains = new Map<string, GainNode>()
  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  private voices = new Set<Voice>()
  private cache = new Map<string, AudioBuffer>()
  private pending = new Map<string, Promise<AudioBuffer>>()
  private revision = new Map<string, number>()
  private previous = new Map<string, string>()
  private bursts = new Map<string, number>()
  private failures = new Map<string, number>()
  private epoch = 0
  private running = false
  private prominentAfter = 0
  private personalAfter = 0
  private personalId = 0
  private errors: Record<string, string> = {}
  private settings: MixerSettings

  constructor(private categories: SoundCategory[], settings: MixerSettings, private notify: (state: EngineState) => void) {
    this.settings = structuredClone(settings)
  }
  private emit() { this.notify({ playing: this.running, active: [...new Set([...this.voices].map(v => v.category.id))], errors: { ...this.errors }, personal: [...this.voices].find(v => v.personal)?.personal }) }
  private initialize() {
    if (this.context) return
    const ctx = new AudioContext({ latencyHint: 'playback' })
    this.context = ctx
    this.master = ctx.createGain()
    this.master.gain.value = this.settings.master * MASTER_BOOST
    this.compressor = ctx.createDynamicsCompressor()
    this.compressor.threshold.value = -18
    this.compressor.knee.value = 18
    this.compressor.ratio.value = 3
    this.compressor.attack.value = 0.008
    this.compressor.release.value = 0.3
    this.master.connect(this.compressor).connect(ctx.destination)
    for (const c of this.categories) {
      const gain = ctx.createGain()
      gain.gain.value = this.settings.channels[c.id].volume
      gain.connect(this.master)
      this.channelGains.set(c.id, gain)
    }
    ctx.onstatechange = () => {
      // OS/browser interruption requires a fresh user gesture; never catch up missed events.
      if ((this.running || this.voices.size > 0) && ctx.state !== 'running') this.pause()
    }
  }
  async start() {
    if (this.running) return
    if (this.voices.size) this.pause()
    const epoch = ++this.epoch
    this.initialize()
    await this.context!.resume()
    if (epoch !== this.epoch) return
    this.running = true
    this.prominentAfter = this.context!.currentTime + between(35, 65)
    this.personalAfter = this.context!.currentTime + between(18, 36)
    for (const c of this.categories) {
      if (!this.settings.channels[c.id].enabled) continue
      this.schedule(c, c.initialDelay ? between(...c.initialDelay) : naturalDelay(c.minInterval, c.maxInterval))
    }
    this.emit()
  }
  pause() {
    this.running = false
    const epoch = ++this.epoch
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
    this.bursts.clear()
    for (const voice of [...this.voices]) this.stopVoice(voice)
    this.emit()
    setTimeout(() => {
      if (epoch === this.epoch && !this.running) void this.context?.suspend().catch(() => {})
    }, 80)
  }
  update(settings: MixerSettings) {
    const old = this.settings
    this.settings = structuredClone(settings)
    const now = this.context?.currentTime ?? 0
    this.master?.gain.setTargetAtTime(settings.master * MASTER_BOOST, now, 0.04)
    if (old.personalEvents !== false && settings.personalEvents === false) {
      for (const voice of [...this.voices]) if (voice.personal) { this.stopVoice(voice); this.next(voice.category) }
    }
    for (const c of this.categories) {
      const channel = settings.channels[c.id]
      this.channelGains.get(c.id)?.gain.setTargetAtTime(channel.volume, now, 0.04)
      if (old.channels[c.id].enabled === channel.enabled) continue
      this.revision.set(c.id, (this.revision.get(c.id) ?? 0) + 1)
      clearTimeout(this.timers.get(c.id))
      this.timers.delete(c.id)
      this.bursts.delete(c.id)
      if (!channel.enabled) {
        for (const voice of [...this.voices]) if (voice.category.id === c.id) this.stopVoice(voice)
      } else if (this.running) {
        this.schedule(c, c.prominent ? naturalDelay(c.minInterval, c.maxInterval) : between(0.5, 4))
      }
    }
    this.emit()
  }
  private schedule(c: SoundCategory, seconds: number) {
    clearTimeout(this.timers.get(c.id))
    if (!this.running || !this.settings.channels[c.id].enabled) return
    this.timers.set(c.id, setTimeout(() => { this.timers.delete(c.id); void this.play(c) }, seconds * 1000))
  }
  private next(c: SoundCategory) {
    const burstCount = this.bursts.get(c.id) ?? 0
    if (c.burst && burstCount < c.burst.max - 1 && Math.random() < c.burst.chance) {
      this.bursts.set(c.id, burstCount + 1)
      this.schedule(c, between(...c.burst.gap))
    } else {
      this.bursts.set(c.id, 0)
      this.schedule(c, naturalDelay(c.minInterval, c.maxInterval))
    }
  }
  private async buffer(file: string): Promise<AudioBuffer> {
    const cached = this.cache.get(file)
    if (cached) { this.cache.delete(file); this.cache.set(file, cached); return cached }
    const loading = this.pending.get(file)
    if (loading) return loading
    const request = (async () => {
      const response = await fetch(soundUrl(file), { signal: AbortSignal.timeout(20000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = await this.context!.decodeAudioData(await response.arrayBuffer())
      this.cache.set(file, buffer)
      let bytes = [...this.cache.values()].reduce((sum, b) => sum + b.length * b.numberOfChannels * 4, 0)
      for (const [key, b] of this.cache) {
        if (bytes <= 36 * 1024 * 1024 || this.cache.size === 1) break
        this.cache.delete(key); bytes -= b.length * b.numberOfChannels * 4
      }
      return buffer
    })()
    this.pending.set(file, request)
    try { return await request } finally { this.pending.delete(file) }
  }
  private async play(c: SoundCategory) {
    if (!this.running || !this.settings.channels[c.id].enabled) return
    const epoch = this.epoch, revision = this.revision.get(c.id)
    const valid = () => this.running && epoch === this.epoch && revision === this.revision.get(c.id) && this.settings.channels[c.id].enabled
    const room = () => canPlay(c, [...this.voices].map(v => v.category), this.context!.currentTime, this.prominentAfter)
    if (!room() || this.settings.channels[c.id].volume === 0) { this.schedule(c, between(3, 9)); return }
    const file = chooseFile(c.soundFiles, this.previous.get(c.id))
    try {
      const buffer = await this.buffer(file.file)
      if (!valid()) return
      if (!room()) { this.schedule(c, between(3, 9)); return }
      this.errors[c.id] && delete this.errors[c.id]
      this.failures.delete(c.id)
      this.previous.set(c.id, file.file)
      const personal = this.settings.personalEvents !== false && this.settings.master > 0 &&
        canBecomePersonal(c, this.context!.currentTime, this.personalAfter, [...this.voices].some(v => !!v.personal))
      this.createVoice(c, file, buffer, personal)
    } catch {
      if (!valid()) return
      this.errors[c.id] = '음원을 불러오지 못했습니다. 잠시 후 다시 시도합니다.'
      const count = (this.failures.get(c.id) ?? 0) + 1
      this.failures.set(c.id, count)
      this.schedule(c, Math.min(120, 5 * 2 ** Math.min(count, 5)))
      this.emit()
    }
  }
  async previewPersonal(kind: PersonalAction) {
    // An explicit debug preview is isolated from the ambient session and native file player.
    this.pause()
    const epoch = ++this.epoch
    const c = this.categories.find(category => category.id === kind)
    if (!c) return
    this.initialize()
    await this.context!.resume()
    if (epoch !== this.epoch) return
    const files = kind === 'keyboard' ? c.soundFiles.filter(f => !f.file.includes('spacebar')) : c.soundFiles
    const file = chooseFile(files.length ? files : c.soundFiles, this.previous.get(c.id))
    const buffer = await this.buffer(file.file)
    if (epoch !== this.epoch) return
    this.previous.set(c.id, file.file)
    this.createVoice(c, file, buffer, true)
  }
  private createVoice(c: SoundCategory, file: SoundFile, buffer: AudioBuffer, personal = false) {
    const ctx = this.context!, now = ctx.currentTime
    const start = file.trimStart ?? 0, end = Math.min(file.trimEnd ?? buffer.duration, buffer.duration)
    const available = Math.max(0.01, end - start)
    const duration = file.excerpt ? Math.min(available, between(...file.excerpt)) : available
    const offset = file.excerpt ? between(start, Math.max(start, end - duration)) : start
    const lead = personal && (c.id === 'mouse' || c.id === 'keyboard') ? 0.55 : 0
    const tail = personal ? (c.id === 'mouse' ? 0.65 : c.id === 'keyboard' ? 0.5 : 0.3) : 0
    const soundStart = now + lead
    const source = ctx.createBufferSource(), gain = ctx.createGain(), pan = ctx.createStereoPanner()
    source.buffer = buffer
    const level = file.gain * between(c.minVolume, c.maxVolume) * (personal ? 1.12 : 1)
    const fade = Math.min(file.excerpt ? 0.18 : 0.012, duration / 4)
    gain.gain.setValueAtTime(0, soundStart)
    gain.gain.linearRampToValueAtTime(level, soundStart + fade)
    gain.gain.setValueAtTime(level, soundStart + Math.max(fade, duration - fade))
    gain.gain.linearRampToValueAtTime(0, soundStart + duration)
    pan.pan.value = personal ? 0 : between(...c.panRange)
    source.connect(gain).connect(pan).connect(this.channelGains.get(c.id)!)
    const voice: Voice = { source, gain, pan, category: c }
    if (personal) {
      voice.personal = { id: ++this.personalId, kind: c.id as PersonalAction, startedAt: performance.now(), duration: lead + duration + tail, soundOffset: lead, soundDuration: duration }
      this.personalAfter = now + lead + duration + tail + between(65, 150)
    }
    this.voices.add(voice)
    if (c.prominent) this.prominentAfter = soundStart + duration + between(55, 100)
    const finish = () => {
      if (!this.voices.has(voice)) return
      this.voices.delete(voice)
      source.disconnect(); gain.disconnect(); pan.disconnect()
      this.next(c); this.emit()
    }
    source.onended = () => {
      if (tail) voice.tailTimer = setTimeout(finish, tail * 1000)
      else finish()
    }
    source.start(soundStart, offset, duration)
    this.emit()
  }
  private stopVoice(voice: Voice) {
    const now = this.context!.currentTime
    clearTimeout(voice.tailTimer)
    voice.source.onended = () => { voice.source.disconnect(); voice.gain.disconnect(); voice.pan.disconnect() }
    voice.gain.gain.cancelAndHoldAtTime(now)
    voice.gain.gain.linearRampToValueAtTime(0, now + 0.05)
    voice.source.stop(now + 0.06)
    this.voices.delete(voice)
  }
  dispose() {
    this.pause()
    if (this.context) { this.context.onstatechange = null; void this.context.close() }
    this.cache.clear()
  }
}
