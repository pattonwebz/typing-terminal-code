import { useEffect, useRef, useState } from 'react'
import { UPGRADES, upgradeCost, deriveStats } from './upgrades.js'
import { createTicket } from './tickets.js'

const SAVE_KEY = 'typing-terminal-save-v2'
const V1_KEY = 'typing-terminal-save-v1'
// Cap offline earnings so a week away doesn't trivialize the economy.
const MAX_OFFLINE_SECONDS = 4 * 60 * 60
// Starting era is 'spa' until era snippet banks land (step 3), so gameplay
// matches v0's modern-JS snippet bank.
const STARTING_ERA = 'spa'

function emptyState() {
  return {
    currencies: { loc: 0, money: 0 },
    lifetimeLoc: 0,
    era: STARTING_ERA,
    // ticket completions per era; drives the bug-rate curve from step 5
    proficiency: {},
    owned: {},
    tickets: { open: [], active: null, completedCount: 0 },
    offlineEarned: 0,
  }
}

function migrateV1(v1) {
  return {
    ...emptyState(),
    currencies: { loc: v1.loc ?? 0, money: 0 },
    lifetimeLoc: v1.totalLoc ?? 0,
    owned: v1.owned ?? {},
    savedAt: v1.savedAt,
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return JSON.parse(raw)
    const v1 = localStorage.getItem(V1_KEY)
    if (v1) return migrateV1(JSON.parse(v1))
    return null
  } catch {
    return null
  }
}

function initialState() {
  const base = loadSave() ?? emptyState()
  // Grant offline passive income for time elapsed since last save.
  const stats = deriveStats(base.owned)
  const away = Math.min(
    Math.max(0, (Date.now() - (base.savedAt ?? Date.now())) / 1000),
    MAX_OFFLINE_SECONDS
  )
  const offlineEarned = Math.floor(away * stats.passiveRate)
  const state = {
    ...emptyState(),
    ...base,
    currencies: {
      ...base.currencies,
      loc: base.currencies.loc + offlineEarned,
    },
    lifetimeLoc: base.lifetimeLoc + offlineEarned,
    offlineEarned,
  }
  if (!state.tickets.active) {
    state.tickets = {
      ...state.tickets,
      active: createTicket(state.era, state.lifetimeLoc),
    }
  }
  return state
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
    const { offlineEarned, ...save } = state
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ ...save, savedAt: Date.now() })
    )
  }, [state])

  function earn(amount) {
    setState((s) => ({
      ...s,
      currencies: { ...s.currencies, loc: s.currencies.loc + amount },
      lifetimeLoc: s.lifetimeLoc + amount,
    }))
  }

  // Called when the active ticket's snippet is fully typed: pays Money,
  // bumps era proficiency, and pulls up the next ticket.
  function completeTicket() {
    setState((s) => {
      const done = s.tickets.active
      if (!done) return s
      return {
        ...s,
        currencies: { ...s.currencies, money: s.currencies.money + done.payMoney },
        proficiency: {
          ...s.proficiency,
          [s.era]: (s.proficiency[s.era] ?? 0) + 1,
        },
        tickets: {
          ...s.tickets,
          active: createTicket(s.era, s.lifetimeLoc, done.snippet.code),
          completedCount: s.tickets.completedCount + 1,
        },
      }
    })
  }

  function buy(upgradeId) {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId)
    setState((s) => {
      const n = s.owned[upgradeId] ?? 0
      const cost = upgradeCost(upgrade, n)
      if (n >= upgrade.max || s.currencies.loc < cost) return s
      return {
        ...s,
        currencies: { ...s.currencies, loc: s.currencies.loc - cost },
        owned: { ...s.owned, [upgradeId]: n + 1 },
      }
    })
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(V1_KEY)
    const fresh = emptyState()
    fresh.tickets.active = createTicket(fresh.era, 0)
    setState(fresh)
  }

  return { state, stats, earn, completeTicket, buy, reset }
}
