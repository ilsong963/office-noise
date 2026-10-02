import type { SoundCategory, SoundFrequency } from './types'

export const frequencies = [
  { id: 'low', name: '드물게' },
  { id: 'normal', name: '보통' },
  { id: 'high', name: '자주' },
] as const
export function normalizeFrequency(value: unknown): SoundFrequency | undefined {
  return value === 'low' || value === 'normal' || value === 'high' ? value : undefined
}
export function intervalRange(category: SoundCategory, frequency: SoundFrequency = 'normal'): [number, number] {
  const scale = frequency === 'low' ? 1.8 : frequency === 'high' ? .45 : 1
  return [Math.max(.5, Math.min(240, category.minInterval * scale)), Math.max(.5, Math.min(240, category.maxInterval * scale))]
}
export function intervalLabel(range: [number, number]) {
  const format = (n: number) => n < 10 ? +n.toFixed(1) : Math.round(n)
  return `${format(range[0])}–${format(range[1])}초 간격`
}
