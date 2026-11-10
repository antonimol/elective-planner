import { useEffect, useRef, useState } from 'react'

interface Props {
  text: string
  open: boolean
  onClose: () => void
}

export function SummaryDialog({ text, open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'failed'>('idle')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      setCopied('idle')
    }
    if (!open && d.open) d.close()
  }, [open])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('ok')
    } catch {
      // Clipboard API blocked: fall back to the legacy copy command, else leave the text selected.
      areaRef.current?.select()
      setCopied(document.execCommand('copy') ? 'ok' : 'failed')
    }
  }

  return (
    <dialog ref={ref} className="summary-dialog" onClose={onClose} aria-labelledby="summary-title">
      <div className="summary-head">
        <h2 id="summary-title">Plan summary</h2>
        <button type="button" className="btn small" onClick={onClose} aria-label="Close">
          Close
        </button>
      </div>
      <textarea ref={areaRef} readOnly value={text} rows={22} aria-label="Plan summary text" onFocus={(e) => e.target.select()} />
      <div className="actions">
        <span className="muted small" role="status">
          {copied === 'ok' && '✓ Copied to clipboard.'}
          {copied === 'failed' && 'Copy blocked by the browser. Text is selected: press Ctrl/Cmd+C.'}
        </span>
        <button type="button" className="btn primary" onClick={copy}>
          Copy to clipboard
        </button>
      </div>
    </dialog>
  )
}
