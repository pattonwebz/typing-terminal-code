import { useEffect, useRef, useState } from 'react'
import { UPGRADES, upgradeCost, deriveStats } from './upgrades.js'

const SAVE_KEY = 'typing-terminal-save-v1'
// Cap offline earnings so a week away doesn't trivialize the economy.
const MAX_OFFLINE_SECONDS = 4 * 60 * 60

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function initialState() {
  const save = loadSave()
  const base = save ?? { loc: 0, totalLoc: 0, owned: {}, savedAt: Date.now() }
  // Grant offline passive income for time elapsed since last save.
  const stats = deriveStats(base.owned)
  const away = Math.min(
    Math.max(0, (Date.now() - (base.savedAt ?? Date.now())) / 1000),
    MAX_OFFLINE_SECONDS
  )
  const offlineEarned = Math.floor(away * stats.passiveRate)
  return {
    loc: base.loc + offlineEarned,
    totalLoc: base.totalLoc + offlineEarned,
    owned: base.owned,
    offlineEarned,
  }
}

export function useGameState() {
  const [state, setState] = useState(initialState)
  const stats = deriveStats(state.owned)
  const statsRef = useRef(stats)
  statsRef.current = stats

  // Passive income tick.
  useEffect(() => {
    const t = setInterval(() => {
      const rate = statsRef.current.passiveRate
      if (rate > 0) earn(rate)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Autosave on change (and stamp savedAt for offline progress).
  useEffect(() => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        loc: state.loc,
        totalLoc: state.totalLoc,
        owned: state.owned,
        savedAt: Date.now(),
      })
    )
  }, [state])

  function earn(amount) {
    setState((s) => ({
      ...s,
      loc: s.loc + amount,
      totalLoc: s.totalLoc + amount,
    }))
  }

  function buy(upgradeId) {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId)
    setState((s) => {
      const n = s.owned[upgradeId] ?? 0
      const cost = upgradeCost(upgrade, n)
      if (n >= upgrade.max || s.loc < cost) return s
      return {
        ...s,
        loc: s.loc - cost,
        owned: { ...s.owned, [upgradeId]: n + 1 },
      }
    })
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY)
    setState({ loc: 0, totalLoc: 0, owned: {}, offlineEarned: 0 })
  }

  return { state, stats, earn, buy, reset }
}
