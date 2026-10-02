import { useEffect, useState } from 'react'
import type { PersonalEvent } from '../audio/types'
import { spriteFrame, spriteNames } from './spriteTimeline'
import { characterUrl, type CharacterId } from '../data/characters'

const labels = { keyboard: '내 자리에서 타이핑하는 중', mouse: '내 자리에서 마우스를 움직이는 중', sigh: '잠깐, 한숨 돌리는 중' }
export default function OfficeScene({ personal, motionEnabled, character }: { personal?: PersonalEvent; motionEnabled: boolean; character: CharacterId }) {
  const atlasUrl = characterUrl(character)
  const [loadedUrl, setLoadedUrl] = useState('')
  const ready = loadedUrl === atlasUrl
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const image = new Image()
    let disposed = false
    image.onload = () => { if (!disposed) setLoadedUrl(atlasUrl) }
    image.onerror = () => { if (!disposed) setLoadedUrl('') }
    image.src = atlasUrl
    return () => { disposed = true }
  }, [atlasUrl])
  useEffect(() => {
    let request = 0
    const update = () => {
      const elapsed = personal ? (performance.now() - personal.startedAt) / 1000 : 0
      setFrame(spriteFrame(personal, elapsed, motionEnabled))
      if (ready && motionEnabled && personal && elapsed < personal.duration) request = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(request)
  }, [personal, ready, motionEnabled])
  const current = personal && motionEnabled ? frame : 0
  const cell = ready ? current : 0
  const displayUrl = ready ? atlasUrl : loadedUrl || characterUrl('male-sparse')
  const column = cell % 4, row = Math.floor(cell / 4)
  return <div className="room-scene" data-character={character} data-personal-action={personal?.kind ?? 'idle'} data-motion={!motionEnabled ? 'reduced' : ready ? 'ready' : 'fallback'} data-sprite-frame={spriteNames[current]}>
    <div className="office-sprite-stage" role="img" aria-label="흰 여백 가운데 책상, 의자, 얇은 모니터와 직원 한 명의 뒷모습. 키보드 오른쪽에 마우스가 놓여 있습니다."><div className="office-sprite-pose" style={{ backgroundImage: `url("${displayUrl}")`, backgroundPosition: `${column / 3 * 100}% ${row * 100}%` }}/></div>
    <span className="sr-only" aria-live="polite">{personal ? labels[personal.kind] : ''}</span>
  </div>
}
