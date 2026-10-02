import { useEffect, useRef, useState } from 'react'
import { Check, Pause, Play, Shuffle, SlidersHorizontal, UserRound, Volume2, X } from 'lucide-react'
import OfficeScene from './scene/OfficeScene'
import SoundRequestDialog from './components/SoundRequestDialog'
import { crowdProfile, MIN_PEOPLE, MAX_PEOPLE } from './audio/crowd'
import { OfficeEngine } from './audio/OfficeEngine'
import type { EngineState, MixerSettings } from './audio/types'
import { categories } from './data/sounds'
import { defaults, loadSettings, storageKey } from './data/settings'
import { characters, characterUrl, loadCharacter, type CharacterId } from './data/characters'

export default function App() {
  const [settings, setSettings] = useState<MixerSettings>(loadSettings)
  const [state, setState] = useState<EngineState>({ playing: false, active: [], errors: {} })
  const [character, setCharacter] = useState<CharacterId>(loadCharacter)
  const [gender, setGender] = useState<'female' | 'male'>(() => characters.find(c => c.id === character)!.gender)
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [mode, setMode] = useState<'auto' | 'custom'>(() => categories.every(c => settings.channels[c.id].enabled === c.enabledByDefault) ? 'auto' : 'custom')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const engine = useRef<OfficeEngine | null>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  useEffect(() => {
    const instance = new OfficeEngine(categories, settingsRef.current, setState)
    engine.current = instance
    return () => { instance.dispose(); engine.current = null }
  }, [])
  useEffect(() => {
    engine.current?.update(settings)
    try { localStorage.setItem(storageKey, JSON.stringify({ ...settings, channels: Object.fromEntries(categories.map(c => [c.id, settings.channels[c.id]])) })) } catch { /* Local preferences are optional. */ }
  }, [settings])
  useEffect(() => { try { localStorage.setItem('office-noise:character', character) } catch { /* Local preferences are optional. */ } }, [character])
  const toggle = async () => {
    if (starting) return
    if (state.playing) { engine.current?.pause(); return }
    setStarting(true); setError('')
    try { await engine.current?.start() } catch { setError('재생하지 못했습니다. 다시 눌러주세요.') } finally { setStarting(false) }
  }
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (requestOpen) return
      if (event.key === 'Escape') { setLeftOpen(false); setRightOpen(false); return }
      if (event.code !== 'Space' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      if ((event.target as HTMLElement).closest('input, button, select, textarea, a, summary, [contenteditable="true"]')) return
      event.preventDefault(); void toggle()
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  })
  const updateChannel = (id: string, update: Partial<MixerSettings['channels'][string]>) => {
    setMode('custom'); setSettings(s => ({ ...s, channels: { ...s.channels, [id]: { ...s.channels[id], ...update } } }))
  }
  const automatic = () => {
    setMode('auto'); const preset = defaults()
    setSettings(s => ({ ...s, channels: Object.fromEntries(categories.map(c => [c.id, preset.channels[c.id] ?? { ...s.channels[c.id], enabled: false }])) }))
  }
  const playing = state.playing
  const crowd = crowdProfile(settings.officePeople)
  return <main className="office-app">
    <OfficeScene personal={state.personal} motionEnabled={state.playing && settings.animationEnabled !== false} character={character}/>
    <button className="edge-button edge-left" aria-label="캐릭터 패널 열기" aria-expanded={leftOpen} aria-controls="character-panel" onClick={() => { setLeftOpen(true); if (window.innerWidth <= 700) setRightOpen(false) }}><UserRound size={19}/></button>
    <button className="edge-button edge-right" aria-label="소리 패널 열기" aria-expanded={rightOpen} aria-controls="sound-panel" onClick={() => { setRightOpen(true); if (window.innerWidth <= 700) setLeftOpen(false) }}><SlidersHorizontal size={19}/></button>
    <aside id="character-panel" className={`side-panel left-panel ${leftOpen ? 'is-open' : ''}`} inert={!leftOpen} aria-hidden={!leftOpen} aria-label="캐릭터">
      <div className="panel-heading"><h2>캐릭터</h2><button className="icon-button" aria-label="캐릭터 패널 닫기" onClick={() => setLeftOpen(false)}><X size={18}/></button></div>
      <div className="segmented" aria-label="성별"><button aria-pressed={gender === 'female'} onClick={() => setGender('female')}>여자</button><button aria-pressed={gender === 'male'} onClick={() => setGender('male')}>남자</button></div>
      <div className="hair-options">{characters.filter(c => c.gender === gender).map(c => <button key={c.id} className="hair-card" aria-pressed={character === c.id} onClick={() => setCharacter(c.id)}><span className="hair-preview" style={{ backgroundImage: `url("${characterUrl(c.id)}")` }}/><span>{c.name}</span>{character === c.id && <Check size={13}/>}</button>)}</div>

      <div className="character-animation"><span>애니메이션</span><button className="animation-switch" role="switch" aria-label="애니메이션" aria-checked={settings.animationEnabled !== false} onClick={() => setSettings(s => ({ ...s, animationEnabled: s.animationEnabled === false }))}><span>{settings.animationEnabled !== false ? 'ON' : 'OFF'}</span><i/></button></div>
    </aside>
    <aside id="sound-panel" className={`side-panel right-panel ${rightOpen ? 'is-open' : ''}`} inert={!rightOpen} aria-hidden={!rightOpen} aria-label="소리">
      <div className="panel-heading"><h2>소리</h2><button className="icon-button" aria-label="소리 패널 닫기" onClick={() => setRightOpen(false)}><X size={18}/></button></div>
      <div className="office-occupancy">
        <div className="occupancy-heading"><label htmlFor="office-people">사무실 인원</label><output htmlFor="office-people">{crowd.people}명</output></div>
        <input id="office-people" type="range" min={MIN_PEOPLE} max={MAX_PEOPLE} step="1" value={crowd.people} aria-valuetext={`${crowd.people}명, 최대 ${crowd.maxVoices}개 소리 동시 재생`} aria-describedby="overlap-limit" onChange={e => setSettings(s => ({ ...s, officePeople: +e.target.value }))}/>
        <div className="occupancy-endpoints" aria-hidden="true"><span>{MIN_PEOPLE}명</span><span>{MAX_PEOPLE}명</span></div>
        <p id="overlap-limit">최대 <strong>{crowd.maxVoices}개</strong> 소리 동시 재생</p>
      </div>
      <div className="segmented"><button aria-pressed={mode === 'auto'} onClick={automatic}><Shuffle size={13}/>자동</button><button aria-pressed={mode === 'custom'} onClick={() => setMode('custom')}>직접 선택</button></div>
      {mode === 'custom' && <>
        <div className="list-toolbar"><button onClick={() => setSettings(s => ({ ...s, channels: Object.fromEntries(categories.map(c => [c.id, { ...s.channels[c.id], enabled: true }])) }))}>모두 켜기</button><button onClick={() => setSettings(s => ({ ...s, channels: Object.fromEntries(categories.map(c => [c.id, { ...s.channels[c.id], enabled: false }])) }))}>모두 끄기</button></div>
        <div className="sound-list">{categories.map(c => <label className={`sound-option ${state.active.includes(c.id) ? 'is-active' : ''}`} key={c.id}><span>{c.name}</span><input type="checkbox" checked={settings.channels[c.id].enabled} onChange={e => updateChannel(c.id, { enabled: e.target.checked })}/></label>)}</div>
      </>}
      <div className="request-entry"><button onClick={() => setRequestOpen(true)}>사무실 소음 요청</button></div>
    </aside>
    <div className="transport" aria-label="재생 컨트롤"><button className="transport-play" aria-label={playing ? '전체 사운드 일시정지' : '전체 사운드 시작'} title={playing ? '일시정지' : '재생'} disabled={starting} onClick={() => void toggle()}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button><span className="transport-divider"/><Volume2 size={15} aria-hidden="true"/><input aria-label="전체 볼륨" type="range" min="0" max="100" value={Math.round(settings.master * 100)} onChange={e => setSettings(s => ({ ...s, master: +e.target.value / 100 }))}/></div>
    <SoundRequestDialog open={requestOpen} onClose={() => setRequestOpen(false)}/>
    {error && <div className="error-toast" role="alert"><span>{error}</span><button className="icon-button" aria-label="오류 닫기" onClick={() => setError('')}><X size={15}/></button></div>}
  </main>
}
