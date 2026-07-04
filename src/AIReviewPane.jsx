import { useMemo, useState } from 'react'
import { GOOD_HUNKS, BAD_HUNKS, AI_NAME, AI_EXCUSES } from './data/aiHunks.js'
import { floatText } from './effects.js'

const HUNKS_PER_TICKET = 3
const LOC_PER_GOOD_HUNK = 150

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// AI-era flow: you typed the prompt (TypingPane); now ShipItGPT answers in
// hunks and your actual job is the review. Accept bad code and it ships —
// raising unmaintainability. Reject good code and the LoC is wasted.
export default function AIReviewPane({ ticket, proficient, onEarn, onShipBad, onComplete }) {
  const hunks = useMemo(
    () =>
      Array.from({ length: HUNKS_PER_TICKET }, () => {
        const bad = Math.random() < 0.45
        const h = bad ? pick(BAD_HUNKS) : pick(GOOD_HUNKS)
        return { ...h, bad }
      }),
    [ticket.id]
  )
  const [idx, setIdx] = useState(0)
  const [log, setLog] = useState([])

  const hunk = hunks[idx]

  function decide(accept) {
    let line
    if (accept && !hunk.bad) {
      onEarn(LOC_PER_GOOD_HUNK)
      line = `✓ merged clean code (+${LOC_PER_GOOD_HUNK} LoC)`
    } else if (accept && hunk.bad) {
      onShipBad()
      line = `✗ shipped garbage. ${AI_NAME}: "${pick(AI_EXCUSES)}"`
      floatText('unmaintainable code +1', 'bad')
    } else if (!accept && hunk.bad) {
      onEarn(Math.round(LOC_PER_GOOD_HUNK / 3))
      line = `✓ caught a bad hunk (+${Math.round(LOC_PER_GOOD_HUNK / 3)} LoC)`
    } else {
      line = `✗ rejected perfectly good code. It's gone.`
    }
    setLog((l) => [...l, line])
    if (idx + 1 >= hunks.length) onComplete()
    else setIdx(idx + 1)
  }

  return (
    <div className="typing-pane ai-review">
      <div className="typing-meta">
        <span className="tier">{AI_NAME} · hunk {idx + 1}/{hunks.length}</span>
        <span className="combo">commit message: "fix everything"</span>
      </div>
      <pre className="snippet">{hunk.code}</pre>
      {proficient && hunk.bad && (
        <p className="hint ai-tell">smells like: {hunk.tell}</p>
      )}
      <div className="ai-actions">
        <button className="ai-accept" onClick={() => decide(true)}>
          accept hunk
        </button>
        <button className="ai-reject" onClick={() => decide(false)}>
          reject hunk
        </button>
      </div>
      <div className="ai-log">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  )
}
