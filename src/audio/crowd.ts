export const MIN_PEOPLE = 1
export const MAX_PEOPLE = 8
export const DEFAULT_PEOPLE = 4

export function normalizePeople(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, Math.round(value))) : DEFAULT_PEOPLE
}

export function crowdProfile(value?: number) {
  const people = normalizePeople(value)
  return {
    people,
    maxVoices: people,
    densityBudget: Math.max(1.8, people * 0.9),
    // Keep the established four-person mix; only ordinary work becomes busier.
    intervalScale: Math.pow(DEFAULT_PEOPLE / people, 0.85),
  }
}
