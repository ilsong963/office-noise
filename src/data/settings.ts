import { DEFAULT_PEOPLE, normalizePeople } from '../audio/crowd'
import { normalizeFrequency } from '../audio/frequency'
import { categories } from './sounds'
import type { MixerSettings } from '../audio/types'
export const defaults = (): MixerSettings => ({ playbackMode: 'auto', master: 0.65, animationEnabled: true, officePeople: DEFAULT_PEOPLE, channels: Object.fromEntries(categories.map(c => [c.id, { enabled: c.enabledByDefault, volume: c.defaultVolume }])) })
const volume = (v: unknown, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback
export function restore(raw: string | null): MixerSettings {
  const result = defaults()
  try {
    const data = JSON.parse(raw ?? 'null')
    if (!data || typeof data !== 'object') return result
    result.officePeople = normalizePeople(data.officePeople)
    result.master = volume(data.master, result.master)
    if (typeof data.animationEnabled === 'boolean') result.animationEnabled = data.animationEnabled
    for (const c of categories) {
      const legacy: Record<string, string> = { water: 'drink', sigh: 'breath', 'phone-vibration': 'phone', 'nail-clipper': 'clipper', 'finger-tapping': 'fingers' }
      const stored = data.channels?.[c.id] ?? data.channels?.[legacy[c.id]]
      if (stored && typeof stored.enabled === 'boolean') result.channels[c.id].enabled = stored.enabled
      result.channels[c.id].volume = volume(stored?.volume, result.channels[c.id].volume)
      const frequency = normalizeFrequency(stored?.frequency)
      if (frequency !== undefined) result.channels[c.id].frequency = frequency
    }
    result.playbackMode = data.playbackMode === 'custom' || (data.playbackMode !== 'auto' && categories.some(c => result.channels[c.id].enabled !== c.enabledByDefault || (result.channels[c.id].frequency !== undefined && result.channels[c.id].frequency !== 'normal'))) ? 'custom' : 'auto'
  } catch { /* Corrupt or old local preferences must not block playback. */ }
  return result
}
export const storageKey = 'office-noise:mix:v1'
export function loadSettings() { try { return restore(localStorage.getItem(storageKey)) } catch { return defaults() } }
