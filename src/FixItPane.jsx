import { useEffect, useRef, useState } from 'react'
import { floatText } from './effects.js'

// Pay per fixed bug scales with snippet length so Fix-Its beat feature
// tickets per keystroke (they're few keystrokes, high value).
const LOC_PER_FIX_PER_CHAR = 1.5

// Diff-mode pane for bugfix tickets: the snippet is shown pre-filled with
// bugs. Click (or arrow-key to) a character and type the correct one.
// Typing over an already-correct character is a mis-fix: combo of pain.
export default function FixItPane({ ticket, stats, highlightBugs, onEarn, onComplete }) {
  const [cursor, setCursor] = useState(0)
  const [code, setCode] = useState(ticket.buggyCode)
  const [fixed, setFixed] = useState([]) // positions already fixed
  const [misfixes, setMisfixes] = useState(0)
  const [lastEvent, setLastEvent] = useState(null)
  const paneRef = useRef(null)

  const bugs = ticket.bugs
  const remaining = bugs.filter((b) => !fixed.includes(b.pos))

  useEffect(() => {
    setCursor(0)
    setCode(ticket.buggyCode)
    setFixed([])
    setMisfixes(0)
  }, [ticket.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCursor((c) => Math.max(0, c - 1))
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCursor((c) => Math.min(code.length - 1, c + 1))
        return
      }
      let key = e.key
      if (key === 'Enter') key = '\n'
      if (key.length !== 1 && key !== '\n') return
      e.preventDefault()

      const bug = remaining.find((b) => b.pos === cursor)
      if (bug && key === bug.correct) {
        // Correct fix: big payout, advance.
        const amount = Math.round(
          code.length * LOC_PER_FIX_PER_CHAR * stats.multiplier
        )
        onEarn(amount)
        floatText(`bug fixed! +${amount} LoC`, 'done', paneRef.current)
        setCode((c) => c.slice(0, cursor) + key + c.slice(cursor + 1))
        const nowFixed = [...fixed, cursor]
        setFixed(nowFixed)
        setLastEvent('fix')
        if (nowFixed.length >= bugs.length) onComplete()
      } else {
        // Mis-fix: either wrong correction or "fixing" working code.
        setMisfixes((m) => m + 1)
        setLastEvent('misfix')
        floatText('that was fine before you touched it', 'bad', paneRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cursor, code, remaining, fixed, bugs, stats, onEarn, onComplete])

  return (
    <div className="typing-pane fixit-pane" ref={paneRef}>
      <div className="typing-meta">
        <span className="tier">Fix-It</span>
        <span className="combo">
          {remaining.length} bug{remaining.length === 1 ? '' : 's'} left
        </span>
        {misfixes > 0 && <span className="combo-broken">{misfixes} mis-fixes</span>}
        {lastEvent === 'fix' && <span className="done">fixed!</span>}
      </div>
      <pre className="snippet">
        {code.split('').map((ch, i) => {
          const isBug = remaining.some((b) => b.pos === i)
          const isFixed = fixed.includes(i)
          const cls = [
            i === cursor ? 'cursor' : '',
            isFixed ? 'typed' : '',
            highlightBugs && isBug ? 'bug-hint' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <span
              key={i}
              className={cls || undefined}
              onClick={() => setCursor(i)}
            >
              {ch === '\n' ? '⏎\n' : ch}
            </span>
          )
        })}
      </pre>
      <p className="hint">
        {highlightBugs
          ? 'Bugs are highlighted. Click one and type the correct character.'
          : 'Something in there is wrong. Click a character and type the fix. Arrows move the cursor.'}
      </p>
    </div>
  )
}
