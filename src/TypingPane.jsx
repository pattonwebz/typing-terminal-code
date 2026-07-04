import { useEffect, useRef, useState } from 'react'
import { TIERS } from './snippets.js'
import { floatText } from './effects.js'

const COMPLETION_BONUS_PER_CHAR = 2

// Chance per auto-typed character that the macro fat-fingers it (counts as
// a typo for the bug system — automation is never free).
const AUTO_TYPO_CHANCE = 0.03

// Controlled typing engine: the active ticket supplies the snippet; the
// parent is told when it's fully typed so it can pay out and rotate tickets.
// autoCps > 0 makes the Autotyper Macro type for you, slowly.
export default function TypingPane({ snippet, stats, onEarn, onComplete, onMiss, autoCps = 0 }) {
  const [pos, setPos] = useState(0)
  const [combo, setCombo] = useState(0)
  const [lastEvent, setLastEvent] = useState(null) // 'crit' | 'miss' | 'done'
  const paneRef = useRef(null)

  const tier = TIERS[snippet.tier]
  const comboMult = 1 + (combo / 50) * stats.comboBoost

  // New snippet (next ticket) — restart progress.
  useEffect(() => {
    setPos(0)
  }, [snippet])

  // Autotyper: fires the same earn/advance path as a real keystroke, at a
  // sedate pace, with the occasional shipped typo.
  useEffect(() => {
    if (autoCps <= 0) return
    const t = setInterval(() => {
      if (Math.random() < AUTO_TYPO_CHANCE) {
        setCombo(0)
        setLastEvent('miss')
        onMiss?.()
        return
      }
      const crit = Math.random() < stats.critChance
      const amount =
        stats.perChar *
        stats.multiplier *
        tier.multiplier *
        comboMult *
        (crit ? 10 : 1)
      onEarn(Math.round(amount * 10) / 10)
      setCombo((c) => c + 1)
      setLastEvent(crit ? 'crit' : null)
      if (pos + 1 >= snippet.code.length) {
        const bonus = Math.round(
          snippet.code.length *
            COMPLETION_BONUS_PER_CHAR *
            stats.multiplier *
            tier.multiplier
        )
        onEarn(bonus)
        setLastEvent('done')
        onComplete()
      } else {
        setPos(pos + 1)
      }
    }, 1000 / autoCps)
    return () => clearInterval(t)
  }, [autoCps, snippet, pos, stats, tier, comboMult, onEarn, onComplete, onMiss])

  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const expected = snippet.code[pos]
      let key = e.key
      if (key === 'Enter') key = '\n'
      if (key.length !== 1 && key !== '\n') return
      e.preventDefault()

      if (key !== expected) {
        setCombo(0)
        setLastEvent('miss')
        onMiss?.()
        return
      }

      const crit = Math.random() < stats.critChance
      if (crit) floatText('CRIT! 10x', 'crit', paneRef.current)
      const amount =
        stats.perChar *
        stats.multiplier *
        tier.multiplier *
        comboMult *
        (crit ? 10 : 1)
      onEarn(Math.round(amount * 10) / 10)
      setCombo((c) => c + 1)
      setLastEvent(crit ? 'crit' : null)

      if (pos + 1 >= snippet.code.length) {
        const bonus = Math.round(
          snippet.code.length *
            COMPLETION_BONUS_PER_CHAR *
            stats.multiplier *
            tier.multiplier
        )
        onEarn(bonus)
        setLastEvent('done')
        floatText(`shipped! +${bonus} LoC`, 'done', paneRef.current)
        onComplete()
      } else {
        setPos(pos + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [snippet, pos, stats, tier, comboMult, onEarn, onComplete, onMiss])

  return (
    <div className="typing-pane" ref={paneRef}>
      <div className="typing-meta">
        <span className={`tier tier-${snippet.tier}`}>{tier.name}</span>
        <span className={`combo ${lastEvent === 'miss' ? 'combo-broken' : ''}`}>
          combo x{comboMult.toFixed(2)} ({combo})
        </span>
        {lastEvent === 'crit' && <span className="crit">CRIT! 10x</span>}
        {lastEvent === 'done' && <span className="done">ticket shipped!</span>}
      </div>
      <pre className="snippet">
        <span className="typed">{snippet.code.slice(0, pos)}</span>
        <span className={`cursor ${lastEvent === 'miss' ? 'miss' : ''}`}>
          {snippet.code[pos] === '\n' ? '⏎\n' : snippet.code[pos]}
        </span>
        <span className="untyped">{snippet.code.slice(pos + 1)}</span>
      </pre>
      <p className="hint">Just start typing the code above.</p>
    </div>
  )
}
