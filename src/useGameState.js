import { useEffect, useRef, useState } from 'react'
import { UPGRADES, upgradeCost, deriveStats } from './upgrades.js'
import { createTicket } from './tickets.js'

const SAVE_KEY = 'typing-terminal-save-v3'
const OLD_KEYS = ['typing-terminal-save-v1', 'typing-terminal-save-v2']
// Cap offline earnings so a week away doesn't trivialize the economy.
const MAX_OFFLINE_SECONDS = 4 * 60 * 60
const TICKET_SPAWN_MS = 8000
// Starting era is 'spa' until era snippet banks land (step 3), so gameplay
// matches v0's modern-JS snippet bank.
const STARTING_ERA = 'spa'
// Pending Legacy (prestige, DESIGN.md) accrues sublinearly from a weighted
// lifetime score, visible from the very beginning of the game.
const LEGACY_DIVISOR = 2500

function emptyState() {
  return {
    currencies: { loc: 0, money: 0 },
    lifetimeLoc: 0,
    // weighted lifetime score feeding pending-Legacy accrual
    lifetimeScore: 0,
    era: STARTING_ERA,
    // ticket completions per era; drives the bug-rate curve from step 5
    proficiency: {},
    owned: {},
    tickets: { open: [], active: null, completedCount: 0 },
    legacy: { banked: 0 },
    offlineEarned: 0,
  }
}

function migrate(save) {
  // v1: { loc, totalLoc, owned, savedAt }
  if ('loc' in save) {
    return {
      ...emptyState(),
      currencies: { loc: save.loc ?? 0, money: 0 },
      lifetimeLoc: save.totalLoc ?? 0,
      lifetimeScore: save.totalLoc ?? 0,
      owned: save.owned ?? {},
      savedAt: save.savedAt,
    }
  }
  // v2: v3 shape minus lifetimeScore/legacy/tickets.open
  return {
    ...emptyState(),
    ...save,
    lifetimeScore: save.lifetimeScore ?? save.lifetimeLoc ?? 0,
    tickets: {
      open: [],
      active: save.tickets?.active ?? null,
      completedCount: save.tickets?.completedCount ?? 0,
    },
    legacy: save.legacy ?? { banked: 0 },
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return migrate(JSON.parse(raw))
    for (const key of OLD_KEYS.slice().reverse()) {
      const old = localStorage.getItem(key)
      if (old) return migrate(JSON.parse(old))
    }
    return null
  } catch {
    return null
  }
}

export function pendingLegacy(state) {
  return Math.floor(Math.sqrt(state.lifetimeScore / LEGACY_DIVISOR))
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
    lifetimeScore: (base.lifetimeScore ?? 0) + offlineEarned,
    offlineEarned,
  }
  if (state.tickets.open.length === 0 && !state.tickets.active) {
    state.tickets = {
      ...state.tickets,
      open: [createTicket(state.era, state.lifetimeLoc)],
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

  // Ticket spawner: refill the board up to capacity.
  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => {
        if (s.tickets.open.length >= statsRef.current.boardSlots) return s
        return {
          ...s,
          tickets: {
            ...s.tickets,
            open: [
              ...s.tickets.open,
              createTicket(s.era, s.lifetimeLoc, s.tickets.active?.snippet.code),
            ],
          },
        }
      })
    }, TICKET_SPAWN_MS)
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
      lifetimeScore: s.lifetimeScore + amount,
    }))
  }

  // Claim an open ticket as the active one (only when nothing is active).
  function pickTicket(ticketId) {
    setState((s) => {
      if (s.tickets.active) return s
      const ticket = s.tickets.open.find((t) => t.id === ticketId)
      if (!ticket) return s
      return {
        ...s,
        tickets: {
          ...s.tickets,
          open: s.tickets.open.filter((t) => t.id !== ticketId),
          active: ticket,
        },
      }
    })
  }

  // Drop the active ticket. It leaves the board — the client takes their
  // business elsewhere (reputation penalty arrives in step 5).
  function abandonTicket() {
    setState((s) => ({
      ...s,
      tickets: { ...s.tickets, active: null },
    }))
  }

  // Called when the active ticket's snippet is fully typed: pays Money,
  // bumps era proficiency and lifetime score, frees the active slot.
  function completeTicket() {
    setState((s) => {
      const done = s.tickets.active
      if (!done) return s
      return {
        ...s,
        currencies: {
          ...s.currencies,
          money: s.currencies.money + done.payMoney,
        },
        // Money is worth more lifetime score than raw LoC: shipping counts.
        lifetimeScore: s.lifetimeScore + done.payMoney * 2,
        proficiency: {
          ...s.proficiency,
          [s.era]: (s.proficiency[s.era] ?? 0) + 1,
        },
        tickets: {
          ...s.tickets,
          active: null,
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
      const wallet = s.currencies[upgrade.currency]
      if (n >= upgrade.max || wallet < cost) return s
      return {
        ...s,
        currencies: {
          ...s.currencies,
          [upgrade.currency]: wallet - cost,
        },
        owned: { ...s.owned, [upgradeId]: n + 1 },
      }
    })
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY)
    for (const key of OLD_KEYS) localStorage.removeItem(key)
    const fresh = emptyState()
    fresh.tickets.open = [createTicket(fresh.era, 0)]
    setState(fresh)
  }

  return {
    state,
    stats,
    earn,
    pickTicket,
    abandonTicket,
    completeTicket,
    buy,
    reset,
  }
}
