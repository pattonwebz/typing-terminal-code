import { useCallback } from 'react'
import { useGameState } from './useGameState.js'
import { UPGRADES, upgradeCost } from './upgrades.js'
import TypingPane from './TypingPane.jsx'
import './App.css'

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
  return Math.floor(n).toString()
}

export default function App() {
  const { state, stats, earn, buy, reset } = useGameState()
  // earn is stable across renders in practice, but memoize for TypingPane's effect
  const onEarn = useCallback(earn, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app">
      <header>
        <h1>~/typing-terminal</h1>
        <div className="currency">
          <span className="loc">{fmt(state.loc)} LoC</span>
          {stats.passiveRate > 0 && (
            <span className="rate">+{stats.passiveRate}/s</span>
          )}
        </div>
      </header>

      {state.offlineEarned > 0 && (
        <div className="offline-banner">
          Your interns wrote {fmt(state.offlineEarned)} LoC while you were away.
        </div>
      )}

      <main>
        <TypingPane stats={stats} totalLoc={state.totalLoc} onEarn={onEarn} />

        <aside className="shop">
          <h2>Upgrades</h2>
          {UPGRADES.map((u) => {
            const n = state.owned[u.id] ?? 0
            const cost = upgradeCost(u, n)
            const maxed = n >= u.max
            return (
              <button
                key={u.id}
                className="upgrade"
                disabled={maxed || state.loc < cost}
                onClick={() => buy(u.id)}
              >
                <span className="upgrade-name">
                  {u.name} {n > 0 && <em>x{n}</em>}
                </span>
                <span className="upgrade-desc">{u.desc}</span>
                <span className="upgrade-cost">
                  {maxed ? 'MAXED' : `${fmt(cost)} LoC`}
                </span>
              </button>
            )
          })}
          <button
            className="reset"
            onClick={() => confirm('Wipe save?') && reset()}
          >
            hard reset
          </button>
        </aside>
      </main>
    </div>
  )
}
