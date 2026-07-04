import { useEffect, useRef, useState } from 'react'
import { floatText } from './effects.js'

// Pay per fixed bug scales with snippet length so Fix-Its beat feature
// tickets per keystroke (they're few keystrokes, high value).
const LOC_PER_FIX_PER_CHAR = 1.5
// Running the linter reveals one hidden bug, at a price.
const LINT_COST_LOC = 150

function lineCol(code, pos) {
  const before = code.slice(0, pos)
  const line = before.split('\n').length
  const col = pos - (before.lastIndexOf('\n') + 1) + 1
  return { line, col }
}

// Diff-mode pane for bugfix tickets: the snippet is shown pre-filled with
// bugs. Click (or arrow-key to) a character and type the correct one.
// Typing over an already-correct character is a mis-fix: combo of pain.
export default function FixItPane({ ticket, stats, highlightBugs, canAfford, onEarn, onComplete }) {
  const [cursor, setCursor] = useState(0)
  const [code, setCode] = useState(ticket.buggyCode)
  const [fixed, setFixed] = useState([]) // positions already fixed
  const [revealed, setRevealed] = useState([]) // positions exposed by the linter
  const [misfixes, setMisfixes] = useState(0)
  const [lastEvent, setLastEvent] = useState(null)
  const paneRef = useRef(null)

  const bugs = ticket.bugs
  const remaining = bugs.filter((b) => !fixed.includes(b.pos))
  const isExposed = (pos) => highlightBugs || revealed.includes(pos)
  const exposedRemaining = remaining.filter((b) => isExposed(b.pos))

  useEffect(() => {
    setCursor(0)
    setCode(ticket.buggyCode)
    setFixed([])
    setRevealed([])
    setMisfixes(0)
  }, [ticket.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function runLinter() {
    const hidden = remaining.filter((b) => !isExposed(b.pos))
    if (hidden.length === 0) return
    onEarn(-LINT_COST_LOC)
    const found = hidden[0]
    setRevealed((r) => [...r, found.pos])
    setCursor(found.pos)
    floatText('linter found something', 'crit', paneRef.current)
  }

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
        floatText(`bug squashed! +${amount} LoC`, 'done', paneRef.current)
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

  const cursorBug = remaining.find((b) => b.pos === cursor)

  return (
    <div className="typing-pane fixit-pane" ref={paneRef}>
      <div className="fixit-banner">
        🐛 BUG HUNT — {remaining.length} bug{remaining.length === 1 ? '' : 's'}{' '}
        {highlightBugs ? 'marked' : 'hiding'} in shipped code. Don't type it —
        find it and fix it.
      </div>
      <div className="typing-meta">
        <span className="tier fixit-tag">Fix-It</span>
        {misfixes > 0 && <span className="combo-broken">{misfixes} mis-fixes</span>}
        {lastEvent === 'fix' && <span className="done">fixed!</span>}
        <button
          className="lint-btn"
          disabled={
            exposedRemaining.length === remaining.length || !canAfford(LINT_COST_LOC)
          }
          onClick={runLinter}
          title="Reveals one hidden bug with a proper diagnostic."
        >
          ▶ run linter (−{LINT_COST_LOC} LoC)
        </button>
      </div>
      <pre className="snippet fixit-snippet">
        {code.split('').map((ch, i) => {
          const isBug = remaining.some((b) => b.pos === i)
          const isFixed = fixed.includes(i)
          const cls = [
            i === cursor ? 'cursor' : '',
            isFixed ? 'typed' : '',
            isBug && isExposed(i) ? 'bug-hint' : '',
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

      <div className="lint-output">
        {exposedRemaining.length === 0 ? (
          <div className="lint-line lint-quiet">
            $ lint … no diagnostics yet.{' '}
            {highlightBugs
              ? ''
              : 'Read the code, or pay the linter to squeal.'}
          </div>
        ) : (
          exposedRemaining.map((b) => {
            const { line, col } = lineCol(code, b.pos)
            return (
              <div
                key={b.pos}
                className="lint-line"
                onClick={() => setCursor(b.pos)}
              >
                <span className="lint-loc">
                  {line}:{col}
                </span>{' '}
                error: unexpected '{code[b.pos]}'
                {b.pos === cursor && (
                  <span className="lint-fix"> — expected '{b.correct === '\n' ? '⏎' : b.correct}'</span>
                )}
              </div>
            )
          })
        )}
        {cursorBug && !isExposed(cursorBug.pos) && (
          <div className="lint-line lint-quiet">
            cursor at {lineCol(code, cursor).line}:{lineCol(code, cursor).col} —
            something here smells off…
          </div>
        )}
      </div>
      <p className="hint">
        Click a character (or use ←/→) and type the correct one. Diagnostics
        show the expected character when your cursor is on the error.
      </p>
    </div>
  )
}
