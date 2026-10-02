export interface SoundFile {
  file: string
  label?: string
  originalFile?: string
  gain: number
  duration: number
  trimStart?: number
  trimEnd?: number
  excerpt?: [number, number]
  weight?: number
}
export interface SoundCategory {
  id: string
  name: string
  description: string
  icon: string
  group: 'work' | 'room' | 'life'
  soundFiles: SoundFile[]
  initialDelay?: [number, number]
  minInterval: number
  maxInterval: number
  minVolume: number
  maxVolume: number
  panRange: [number, number]
  enabledByDefault: boolean
  defaultVolume: number
  densityCost: number
  prominent?: boolean
  burst?: { chance: number; max: number; gap: [number, number] }
}
export type ChannelSettings = Record<string, { enabled: boolean; volume: number }>
export type PersonalAction = 'keyboard' | 'mouse' | 'sigh'
export interface PersonalEvent { id: number; kind: PersonalAction; startedAt: number; duration: number; soundOffset: number; soundDuration: number }
export interface MixerSettings { master: number; channels: ChannelSettings; animationEnabled?: boolean; officePeople?: number }
export interface EngineState { playing: boolean; active: string[]; errors: Record<string, string>; personal?: PersonalEvent }
