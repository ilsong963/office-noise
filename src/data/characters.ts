export const characters = [
  { id: 'female-bob', gender: 'female', name: '단발', asset: 'office-female-bob-v2.png' },
  { id: 'female-long', gender: 'female', name: '긴머리', asset: 'office-female-long-v2.png' },
  { id: 'male-sparse', gender: 'male', name: '3가닥', asset: 'office-male-sparse-v2.png' },
  { id: 'male-short', gender: 'male', name: '짧은머리', asset: 'office-male-short-v2.png' },
  { id: 'male-taper', gender: 'male', name: '상고머리', asset: 'office-male-taper-v2.png' },
] as const
export type CharacterId = typeof characters[number]['id']
export function loadCharacter(): CharacterId {
  try { const id = localStorage.getItem('office-noise:character'); return characters.find(c => c.id === id)?.id ?? 'male-sparse' } catch { return 'male-sparse' }
}
export const characterUrl = (id: CharacterId) => `${import.meta.env.BASE_URL}assets/${characters.find(c => c.id === id)!.asset}`
