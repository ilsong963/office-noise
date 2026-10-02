import { crowdProfile } from './crowd'
import { soundUrl } from './soundUrl'
import { intervalRange } from './frequency'
import { MASTER_BOOST } from './levels'
import { between, canPlay, chooseFile, naturalDelay } from './random'
import type { EngineState, MixerSettings, PersonalAction, PersonalEvent, SoundCategory, SoundFile } from './types'

type Voice = { source: AudioBufferSourceNode; gain: GainNode; pan: StereoPannerNode; category: SoundCategory; personal?: PersonalEvent; preview?: boolean; tailTimer?: ReturnType<typeof setTimeout> }

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
  private waitingSince = new Map<string, number>()
  private previewPending = new Map<string, number>()
  private failures = new Map<string, number>()
  private epoch = 0
  private running = false
  private prominentAfter = 0
  private motionTimer?: ReturnType<typeof setTimeout>
  private motionEnabled = false
  private motionGeneration = 0
  private personal?: PersonalEvent
  private previousAction?: PersonalAction
  private sighAfter = 0
  private personalId = 0
  private errors: Record<string, string> = {}
  private settings: MixerSettings

  constructor(private categories: SoundCategory[], settings: MixerSettings, private notify: (state: EngineState) => void) {
    this.settings = structuredClone(settings)
  }
  private emit() { this.notify({ playing: this.running, active: [...new Set([...this.voices].map(v => v.category.id))], errors: { ...this.errors }, personal: this.running && this.settings.animationEnabled !== false ? this.personal : undefined }) }
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
    this.previewPending.clear()
    this.initialize()
    await this.context!.resume()
    if (epoch !== this.epoch) return
    this.running = true
    this.prominentAfter = this.context!.currentTime
    for (const c of this.categories) {
      if (!this.settings.channels[c.id].enabled) continue
      this.schedule(c, this.settings.playbackMode !== 'custom' && c.initialDelay ? this.activityDelay(c, between(...c.initialDelay)) : this.repeatDelay(c))
    }
    this.startMotion()
    this.emit()
  }
  pause() {
    this.running = false
    this.stopMotion()
    const epoch = ++this.epoch
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
    this.bursts.clear()
    this.waitingSince.clear()
    this.previewPending.clear()
    for (const voice of [...this.voices]) this.stopVoice(voice)
    this.emit()
    setTimeout(() => {
      if (epoch === this.epoch && !this.running && !this.voices.size && !this.previewPending.size) void this.context?.suspend().catch(() => {})
    }, 80)
  }
  update(settings: MixerSettings) {
    const old = this.settings
    this.settings = structuredClone(settings)
    const now = this.context?.currentTime ?? 0
    this.master?.gain.setTargetAtTime(settings.master * MASTER_BOOST, now, 0.04)
    for (const c of this.categories) {
      const channel = settings.channels[c.id]
      this.channelGains.get(c.id)?.gain.setTargetAtTime(channel.volume, now, 0.04)
      if (old.channels[c.id].enabled === channel.enabled && old.channels[c.id].frequency === channel.frequency && old.playbackMode === settings.playbackMode) continue
      this.revision.set(c.id, (this.revision.get(c.id) ?? 0) + 1)
      clearTimeout(this.timers.get(c.id))
      this.timers.delete(c.id)
      this.bursts.delete(c.id)
      this.waitingSince.delete(c.id)
      this.previewPending.delete(c.id)
      if (!channel.enabled) {
        for (const voice of [...this.voices]) if (voice.category.id === c.id) this.stopVoice(voice)
      } else if (this.running && ![...this.voices].some(v => v.category.id === c.id)) {
        this.schedule(c, this.repeatDelay(c))
      }
    }
    if (crowdProfile(old.officePeople).people !== crowdProfile(settings.officePeople).people) {
      const { maxVoices, densityBudget } = crowdProfile(settings.officePeople)
      let count = 0, cost = 0
      // Fade excess voices immediately on reduction, preserving our character if possible.
      const voices = [...this.voices].sort((a, b) => Number(!!b.personal) - Number(!!a.personal))
      for (const voice of voices) {
        if (count < maxVoices && cost + voice.category.densityCost <= densityBudget) {
          count++; cost += voice.category.densityCost
        } else {
          this.stopVoice(voice)
          this.next(voice.category)
        }
      }
      if (this.running && this.settings.playbackMode !== 'custom') for (const c of this.categories) {
        if (!c.prominent && !this.failures.has(c.id) && ![...this.voices].some(v => v.category.id === c.id)) {
          this.schedule(c, this.repeatDelay(c))
        }
      }
    }
    this.emit()
  }
  private activityDelay(c: SoundCategory, seconds: number) {
    return seconds * (c.prominent || this.settings.playbackMode === 'custom' ? 1 : crowdProfile(this.settings.officePeople).intervalScale)
  }
  private repeatDelay(c: SoundCategory) {
    const frequency = this.settings.playbackMode === 'custom' ? this.settings.channels[c.id].frequency : undefined
    return this.activityDelay(c, naturalDelay(...intervalRange(c, frequency)))
  }
  private roomFor(c: SoundCategory) {
    const now = this.context!.currentTime
    const active = [...this.voices].map(v => v.category)
    const cooldown = this.settings.playbackMode === 'custom' ? 0 : this.prominentAfter
    if (!canPlay(c, active, now, cooldown, this.settings.officePeople)) return false
    // Reserve the next free slot for an overdue sound instead of letting frequent
    // keyboard/character events continually jump ahead of it.
    const oldest = [...this.waitingSince].filter(([id]) =>
      this.settings.channels[id]?.enabled && this.settings.channels[id].volume > 0 &&
      !active.some(a => a.id === id) && !this.failures.has(id)
    ).sort((a, b) => a[1] - b[1])[0]
    return !oldest || oldest[0] === c.id || now - oldest[1] < 6
  }
  private suspendIfIdle() {
    if (!this.running && !this.voices.size && !this.previewPending.size) void this.context?.suspend().catch(() => {})
  }
  // A checkbox audition is independent of Start/Pause and uses the real mix gain.
  // It cancels on uncheck/pause/dispose and does not start ambient playback.
  async preview(id: string) {
    const c = this.categories.find(category => category.id === id)
    if (!c || !this.settings.channels[id].enabled) return
    this.initialize()
    const epoch = this.epoch, revision = (this.revision.get(id) ?? 0) + 1
    this.revision.set(id, revision)
    this.previewPending.set(id, revision)
    clearTimeout(this.timers.get(id)); this.timers.delete(id); this.waitingSince.delete(id)
    const valid = () => epoch === this.epoch && revision === this.revision.get(id) &&
      this.previewPending.get(id) === revision && this.settings.channels[id].enabled
    try {
      await this.context!.resume()
      if (!valid()) return
      const file = chooseFile(c.soundFiles, this.previous.get(id))
      const buffer = await this.buffer(file.file)
      if (!valid()) return
      for (const voice of [...this.voices]) {
        if (voice.preview || voice.category.id === id || (c.prominent && voice.category.prominent)) {
          this.stopVoice(voice)
          if (voice.category.id !== id) this.next(voice.category)
        }
      }
      while (!canPlay(c, [...this.voices].map(v => v.category), this.context!.currentTime, 0, this.settings.officePeople)) {
        const voice = [...this.voices].sort((a, b) => Number(!!a.personal) - Number(!!b.personal))[0]
        if (!voice) return
        this.stopVoice(voice)
        this.next(voice.category)
      }
      delete this.errors[id]; this.failures.delete(id)
      this.previous.set(id, file.file)
      this.createVoice(c, file, buffer, false, true)
    } catch {
      if (valid()) {
        this.errors[id] = '음원을 불러오지 못했습니다. 다시 체크해 주세요.'
        if (this.running) this.next(c)
        this.emit()
      }
    } finally {
      if (this.previewPending.get(id) === revision) this.previewPending.delete(id)
      this.suspendIfIdle()
    }
  }
  private schedule(c: SoundCategory, seconds: number) {
    clearTimeout(this.timers.get(c.id))
    if (!this.running || !this.settings.channels[c.id].enabled) return
    this.timers.set(c.id, setTimeout(() => { this.timers.delete(c.id); void this.play(c) }, seconds * 1000))
  }
  private next(c: SoundCategory) {
    const burstCount = this.bursts.get(c.id) ?? 0
    if (this.settings.playbackMode !== 'custom' && c.burst && burstCount < c.burst.max - 1 && Math.random() < c.burst.chance) {
      this.bursts.set(c.id, burstCount + 1)
      this.schedule(c, this.activityDelay(c, between(...c.burst.gap)))
    } else {
      this.bursts.set(c.id, 0)
      this.schedule(c, this.repeatDelay(c))
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
    const room = () => this.roomFor(c)
    if (!this.waitingSince.has(c.id)) this.waitingSince.set(c.id, this.context!.currentTime)
    if (this.settings.channels[c.id].volume === 0) { this.waitingSince.delete(c.id); this.next(c); return }
    if (!room()) { this.schedule(c, between(.8, 1.8)); return }
    const file = chooseFile(c.soundFiles, this.previous.get(c.id))
    try {
      const buffer = await this.buffer(file.file)
      if (!valid()) return
      if (!room()) { this.schedule(c, between(.8, 1.8)); return }
      this.errors[c.id] && delete this.errors[c.id]
      this.failures.delete(c.id)
      this.previous.set(c.id, file.file)
      const personal = this.settings.playbackMode === 'custom' && ['keyboard', 'mouse', 'sigh'].includes(c.id) && ![...this.voices].some(v => v.personal)
      this.createVoice(c, file, buffer, personal)
    } catch {
      if (!valid()) return
      this.waitingSince.delete(c.id)
      this.errors[c.id] = '음원을 불러오지 못했습니다. 잠시 후 다시 시도합니다.'
      const count = (this.failures.get(c.id) ?? 0) + 1
      this.failures.set(c.id, count)
      this.schedule(c, Math.min(120, 5 * 2 ** Math.min(count, 5)))
      this.emit()
    }
  }
  // Desk events belong to playback. The animation preference only controls their visuals.
  private startMotion() {
    if (!this.running || this.motionEnabled) return
    this.motionEnabled = true
    this.scheduleMotion(between(0.4, 1.2))
  }
  private stopMotion() {
    this.motionEnabled = false
    this.motionGeneration++
    clearTimeout(this.motionTimer)
    this.personal = undefined
  }
  private scheduleMotion(seconds: number) {
    clearTimeout(this.motionTimer)
    if (!this.motionEnabled) return
    this.motionTimer = setTimeout(() => { void this.animate() }, seconds * 1000)
  }
  private showMotion(kind: PersonalAction, soundDuration: number) {
    const lead = kind === 'sigh' ? 0 : 0.55
    const tail = kind === 'mouse' ? 0.65 : kind === 'keyboard' ? 0.5 : 0.3
    this.personal = { id: ++this.personalId, kind, startedAt: performance.now(), duration: lead + soundDuration + tail, soundOffset: lead, soundDuration }
    this.previousAction = kind
    if (kind === 'sigh') this.sighAfter = Date.now() + between(75000, 150000)
    clearTimeout(this.motionTimer)
    this.motionTimer = setTimeout(() => {
      this.personal = undefined
      this.emit()
      this.scheduleMotion(between(1.2, 4.5))
    }, this.personal.duration * 1000)
    this.emit()
    return this.personal
  }
  private async animate() {
    if (!this.motionEnabled) return
    const generation = this.motionGeneration
    const kind: PersonalAction = Date.now() >= this.sighAfter && this.previousAction && Math.random() < 0.08
      ? 'sigh' : this.previousAction === 'keyboard' ? 'mouse' : 'keyboard'
    const c = this.categories.find(category => category.id === kind)
    const canSound = () => this.running && this.settings.playbackMode !== 'custom' && !!c && !this.previewPending.has(c.id) &&
      this.settings.channels[c.id].enabled && this.settings.channels[c.id].volume > 0 && this.settings.master > 0 &&
      this.roomFor(c)
    const epoch = this.epoch
    const revision = c ? this.revision.get(c.id) : undefined
    if (c && canSound()) {
      const files = kind === 'keyboard' ? c.soundFiles.filter(f => !f.file.includes('spacebar')) : c.soundFiles
      const file = chooseFile(files.length ? files : c.soundFiles, this.previous.get(c.id))
      try {
        const buffer = await this.buffer(file.file)
        if (!this.motionEnabled || generation !== this.motionGeneration) return
        if (epoch === this.epoch && revision === this.revision.get(c.id) && canSound()) {
          clearTimeout(this.timers.get(c.id))
          this.timers.delete(c.id)
          this.previous.set(c.id, file.file)
          this.createVoice(c, file, buffer, true)
          return
        }
      } catch { /* Keep moving silently when a recording cannot be loaded. */ }
    }
    if (this.motionEnabled && generation === this.motionGeneration) {
      this.showMotion(kind, kind === 'keyboard' ? between(4, 9) : kind === 'mouse' ? between(0.7, 1.8) : between(2, 3.5))
    }
  }
  private createVoice(c: SoundCategory, file: SoundFile, buffer: AudioBuffer, personal = false, preview = false) {
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
    const voice: Voice = { source, gain, pan, category: c, preview }
    this.waitingSince.delete(c.id)
    if (personal) {
      voice.personal = this.showMotion(c.id as PersonalAction, duration)
    }
    this.voices.add(voice)
    if (c.prominent) this.prominentAfter = soundStart + duration + between(3, 8)
    const finish = () => {
      if (!this.voices.has(voice)) return
      this.voices.delete(voice)
      source.disconnect(); gain.disconnect(); pan.disconnect()
      this.next(c); this.emit(); this.suspendIfIdle()
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
    voice.source.onended = () => { voice.source.disconnect(); voice.gain.disconnect(); voice.pan.disconnect(); this.suspendIfIdle() }
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
