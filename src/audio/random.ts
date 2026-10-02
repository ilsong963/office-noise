import { crowdProfile } from './crowd'
import type { SoundCategory, SoundFile } from './types'
export const between = (min: number, max: number, rng = Math.random) => min + (max - min) * rng()
// Average independent uniform samples: more natural central values, no regular clock.
export const naturalDelay = (min: number, max: number, rng = Math.random) => min + (max - min) * (rng() + rng()) / 2
export function chooseFile(files: SoundFile[], previous?: string, rng = Math.random): SoundFile {
  const candidates = files.length > 1 ? files.filter(f => f.file !== previous) : files
  let ticket = rng() * candidates.reduce((sum, f) => sum + (f.weight ?? 1), 0)
  for (const file of candidates) { ticket -= file.weight ?? 1; if (ticket <= 0) return file }
  return candidates[candidates.length - 1]
}
export function canPlay(category: SoundCategory, active: SoundCategory[], now: number, prominentAfter: number, people?: number) {
  const { maxVoices, densityBudget } = crowdProfile(people)
  const foreground = active
  return !active.some(c => c.id === category.id) && foreground.length < maxVoices &&
    foreground.reduce((sum, c) => sum + c.densityCost, 0) + category.densityCost <= densityBudget &&
    (!category.prominent || (now >= prominentAfter && !foreground.some(c => c.prominent)))
}
