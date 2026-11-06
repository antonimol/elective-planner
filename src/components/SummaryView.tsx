import { useRef, useState } from 'react'

export function SummaryView({ text }: { text: string }) {
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'failed'>('idle')

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
    <>
      <div className="toolbar">
        <span>Podsumowanie planu · do skopiowania</span>
        <span className="muted">Wklej do notatek, maila albo arkusza przed biddingiem.</span>
      </div>
      <div className="summary">
        <textarea
          ref={areaRef}
          readOnly
          value={text}
          rows={Math.min(40, text.split('\n').length + 1)}
          aria-label="Tekst podsumowania"
          onFocus={(e) => e.target.select()}
        />
        <div className="summary-actions">
          <button type="button" className="btn primary" onClick={copy}>
            [ Kopiuj do schowka ]
          </button>
          <span role="status">
            {copied === 'ok' && '✓ Skopiowano.'}
            {copied === 'failed' && 'Przeglądarka zablokowała kopiowanie. Tekst jest zaznaczony: naciśnij Cmd/Ctrl+C.'}
          </span>
        </div>
      </div>
    </>
  )
}
