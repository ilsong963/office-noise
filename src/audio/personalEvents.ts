import type { PersonalAction, SoundCategory } from './types'

export const personalActions: PersonalAction[] = ['keyboard', 'mouse', 'sigh']
export function canBecomePersonal(category: SoundCategory, now: number, after: number, occupied: boolean, rng = Math.random) {
  if (occupied || now < after || !personalActions.includes(category.id as PersonalAction)) return false
  // This reassigns an existing sound to our desk; it never adds extra sound density.
  return rng() < (category.id === 'sigh' ? 0.7 : category.id === 'keyboard' ? 0.2 : 0.18)
}
