import { useEffect, useRef, useState } from 'react'
import { UPGRADES, upgradeCost, deriveStats } from './upgrades.js'
import { createTicket, shipRate } from './tickets.js'
import { getEra, nextEra } from './data/eras.js'
import { CLIENTS, clientsForEra } from './data/clients.js'

const SAVE_KEY = 'typing-terminal-save-v3'
const OLD_KEYS = ['typing-terminal-save-v1', 'typing-terminal-save-v2']
// Cap offline earnings so a week away doesn't trivialize the economy.
const MAX_OFFLINE_SECONDS = 4 * 60 * 60
const TICKET_SPAWN_MS = 8000
const DISCOVERY_TICK_MS = 10000
// Chance per discovery tick that a given dormant bug is found by its client
// (nitpicky clients look harder).
const DISCOVERY_CHANCE = 0.02
// Chance per passive-income second that automation ships a dormant bug,
// scaled by the passive rate. Automation is never free (DESIGN.md).
const PASSIVE_BUG_CHANCE_PER_RATE = 0.002
// Dormant + discovered bugs above this soft-cap penalize typing earnings.
export const TECH_DEBT_SOFT_CAP = 10
export const TECH_DEBT_PENALTY = 0.75
const STARTING_ERA = 'html'
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
    // ticket completions per era; drives the bug-rate curve
    proficiency: {},
    owned: {},
    tickets: { open: [], active: null, completedCount: 0 },
    // dormant shipped bugs waiting for a client to trip over them
    codebase: [],
    reputation: 50,
    // typos made on the current active ticket (candidate shipped bugs)
    activeTypos: 0,
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
  // v2/v3: superset shape; missing fields fall back to defaults.
  return {
    ...emptyState(),
    ...save,
    lifetimeScore: save.lifetimeScore ?? save.lifetimeLoc ?? 0,
    tickets: {
      open: save.tickets?.open ?? [],
      active: save.tickets?.active ?? null,
      completedCount: save.tickets?.completedCount ?? 0,
    },
    codebase: save.codebase ?? [],
    reputation: save.reputation ?? 50,
    activeTypos: 0,
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

export function techDebt(state) {
  return (
    state.codebase.length +
    state.tickets.open.filter((t) => t.type === 'bugfix').length
  )
}

function clampRep(r) {
  return Math.max(0, Math.min(100, r))
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

  // Passive income tick — and automation quietly shipping bugs.
  useEffect(() => {
    const t = setInterval(() => {
      const rate = statsRef.current.passiveRate
      if (rate <= 0) return
      setState((s) => {
        const shipsBug =
          Math.random() < rate * PASSIVE_BUG_CHANCE_PER_RATE
        const client = pickRandom(clientsForEra(s.era))
        return {
          ...s,
          currencies: { ...s.currencies, loc: s.currencies.loc + rate },
          lifetimeLoc: s.lifetimeLoc + rate,
          lifetimeScore: s.lifetimeScore + rate,
          codebase: shipsBug
            ? [
                ...s.codebase,
                { clientId: client.id, era: s.era, createdAt: Date.now() },
              ]
            : s.codebase,
        }
      })
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
              createTicket(s.era, s.lifetimeLoc, s.tickets.active?.snippet.code, {
                reputation: s.reputation,
              }),
            ],
          },
        }
      })
    }, TICKET_SPAWN_MS)
    return () => clearInterval(t)
  }, [])

  // Client bug discovery: dormant bugs surface as Bug Fix tickets tagged to
  // the client who found them. Costs reputation when it happens.
  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => {
        if (s.codebase.length === 0) return s
        if (s.tickets.open.length >= statsRef.current.boardSlots) return s
        const found = s.codebase.find((b) => {
          const client = CLIENTS.find((c) => c.id === b.clientId)
          const mult = client?.tags.includes('nitpicky') ? 2 : 1
          return Math.random() < DISCOVERY_CHANCE * mult
        })
        if (!found) return s
        return {
          ...s,
          codebase: s.codebase.filter((b) => b !== found),
          reputation: clampRep(s.reputation - 2),
          tickets: {
            ...s.tickets,
            open: [
              ...s.tickets.open,
              createTicket(found.era, s.lifetimeLoc, null, {
                type: 'bugfix',
                clientId: found.clientId,
                reputation: s.reputation,
              }),
            ],
          },
        }
      })
    }, DISCOVERY_TICK_MS)
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
    setState((s) => {
      const debtPenalty =
        techDebt(s) > TECH_DEBT_SOFT_CAP ? TECH_DEBT_PENALTY : 1
      const gained = amount * debtPenalty
      return {
        ...s,
        currencies: { ...s.currencies, loc: s.currencies.loc + gained },
        lifetimeLoc: s.lifetimeLoc + gained,
        lifetimeScore: s.lifetimeScore + gained,
      }
    })
  }

  // A typo on the active ticket: candidate shipped bug at completion.
  function noteTypo() {
    setState((s) => ({ ...s, activeTypos: s.activeTypos + 1 }))
  }

  // Claim an open ticket as the active one (only when nothing is active).
  function pickTicket(ticketId) {
    setState((s) => {
      if (s.tickets.active) return s
      const ticket = s.tickets.open.find((t) => t.id === ticketId)
      if (!ticket) return s
      return {
        ...s,
        activeTypos: 0,
        tickets: {
          ...s.tickets,
          open: s.tickets.open.filter((t) => t.id !== ticketId),
          active: ticket,
        },
      }
    })
  }

  // Drop the active ticket: the client notices. Small reputation ding.
  function abandonTicket() {
    setState((s) => ({
      ...s,
      reputation: clampRep(s.reputation - 1),
      activeTypos: 0,
      tickets: { ...s.tickets, active: null },
    }))
  }

  // Called when the active ticket is finished: pays Money, bumps era
  // proficiency, ships a fraction of your typos as dormant bugs, and moves
  // reputation (clean work up, bugfix completions up more).
  function completeTicket() {
    setState((s) => {
      const done = s.tickets.active
      if (!done) return s
      const rate = shipRate(s.era, s.proficiency[s.era])
      let shipped = 0
      if (done.type !== 'bugfix') {
        for (let i = 0; i < s.activeTypos; i++) {
          if (Math.random() < rate) shipped++
        }
        // The footgun you didn't know about: even clean work can ship a bug.
        if (Math.random() < rate / 4) shipped++
      }
      const newBugs = Array.from({ length: shipped }, () => ({
        clientId: done.clientId,
        era: done.era,
        createdAt: Date.now(),
      }))
      const repDelta =
        done.type === 'bugfix' ? +3 : shipped === 0 ? +1 : 0
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
        codebase: [...s.codebase, ...newBugs],
        reputation: clampRep(s.reputation + repDelta),
        activeTypos: 0,
        tickets: {
          ...s.tickets,
          active: null,
          completedCount: s.tickets.completedCount + 1,
        },
      }
    })
  }

  // Move to the next era once enough tickets are completed in the current
  // one. Board and active ticket are dropped — new era, new backlog.
  // (Full soft-prestige with Experience lands in step 7.)
  function advanceEra() {
    setState((s) => {
      const next = nextEra(s.era)
      const need = getEra(s.era).ticketsToAdvance
      if (!next || need == null || (s.proficiency[s.era] ?? 0) < need) return s
      return {
        ...s,
        era: next.id,
        activeTypos: 0,
        tickets: {
          ...s.tickets,
          open: [
            createTicket(next.id, s.lifetimeLoc, null, {
              reputation: s.reputation,
            }),
          ],
          active: null,
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
    noteTypo,
    advanceEra,
    pickTicket,
    abandonTicket,
    completeTicket,
    buy,
    reset,
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
