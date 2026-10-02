import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { soundRequestEmbedUrl, soundRequestUrl } from '../data/requests'

export default function SoundRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal()
    else if (!open && dialog.current?.open) dialog.current.close()
  }, [open])

  return <dialog ref={dialog} className="request-dialog" aria-labelledby="request-heading" onClose={onClose}>
    <div className="request-dialog-heading">
      <h2 id="request-heading">사무실 소음 요청</h2>
      <button className="icon-button" aria-label="요청 창 닫기" onClick={() => dialog.current?.close()}><X size={18}/></button>
    </div>
    {open && <iframe title="사무실 소음 요청 작성" src={soundRequestEmbedUrl}/>}
    <a className="request-fallback" href={soundRequestUrl} target="_blank" rel="noopener noreferrer">입력창이 안 보이면 새 창에서 열기</a>
  </dialog>
}
