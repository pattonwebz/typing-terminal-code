import { useEffect, useRef, useState } from 'react'
import { UPGRADES, upgradeCost, deriveStats } from './upgrades.js'
import { XP_UPGRADES, xpUpgradeCost, deriveXpStats } from './data/xpUpgrades.js'
import { DEPRECATION_HEADLINES } from './data/news.js'
import { createTicket, shipRate } from './tickets.js'
import { getEra, nextEra } from './data/eras.js'
import { CLIENTS, clientsForEra } from './data/clients.js'
import { newProduct, tickProduct } from './products.js'
import {
  LEGACY_PERKS,
  legacyPerkCost,
  deriveLegacyStats,
} from './data/legacyPerks.js'
import { PRODUCT_ECONOMY } from './data/products.js'

const SAVE_KEY = 'typing-terminal-save-v3'
const OLD_KEYS = ['typing-terminal-save-v1', 'typing-terminal-save-v2']
// Cap offline earnings so a week away doesn't trivialize the economy.
const MAX_OFFLINE_SECONDS = 4 * 60 * 60
const TICKET_SPAWN_MS = 8000
// How long a framework stays fresh before deprecation rolls begin.
const FRAMEWORK_FRESH_MS = 5 * 60 * 1000
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
    // soft-prestige currency granted at era transitions (this career only)
    xp: 0,
    xpOwned: {},
    // frameworks: { [upgradeId]: { boughtAt, deprecated } }
    frameworks: {},
    news: null,
    // owner switches for owned automation upgrades
    toggles: { autoType: true, autoPick: true },
    products: [],
    // AI-era rot: raises bug discovery; bugfixes chip away at it
    unmaintainability: 0,
    legacy: { banked: 0 },
    legacyOwned: {},
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
    xp: save.xp ?? 0,
    xpOwned: save.xpOwned ?? {},
    frameworks: save.frameworks ?? {},
    news: save.news ?? null,
    toggles: save.toggles ?? { autoType: true, autoPick: true },
    products: save.products ?? [],
    unmaintainability: save.unmaintainability ?? 0,
    legacy: save.legacy ?? { banked: 0 },
    legacyOwned: save.legacyOwned ?? {},
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
  const base = Math.floor(Math.sqrt(state.lifetimeScore / LEGACY_DIVISOR))
  // Surviving deep into the AI era doubles the career's pending Legacy.
  return (state.proficiency?.ai ?? 0) >= 10 ? base * 2 : base
}

// Muscle Memory (Legacy perk) counts as virtual era experience for the
// bug-rate curve and Fix-It highlighting, not for era-advance gating.
export function effectiveProficiency(state, eraId) {
  return (
    (state.proficiency[eraId] ?? 0) +
    deriveLegacyStats(state.legacyOwned).startProficiency
  )
}

export function techDebt(state) {
  return (
    state.codebase.length +
    state.tickets.open.filter((t) => t.type === 'bugfix').length
  )
}

function clampRep(r, floor = 0) {
  return Math.max(floor, Math.min(100, r))
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
  const xpStats = deriveXpStats(state.xpOwned)
  const stats = deriveStats(state.owned, state.frameworks)
  stats.multiplier *= xpStats.typingMult
  const statsRef = useRef(stats)
  statsRef.current = stats
  const xpStatsRef = useRef(xpStats)
  xpStatsRef.current = xpStats
  // reputation floor: max of career (Networking) and permanent (Legacy) perks
  const repFloor = Math.max(
    xpStats.repFloor,
    deriveLegacyStats(state.legacyOwned).repFloor
  )
  const repFloorRef = useRef(repFloor)
  repFloorRef.current = repFloor

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
        const n =
          1 + (Math.random() < xpStatsRef.current.spawnSpeed - 1 ? 1 : 0)
        const spawned = Array.from({ length: n }, () =>
          createTicket(s.era, s.lifetimeLoc, s.tickets.active?.snippet.code, {
            reputation: s.reputation,
          })
        ).slice(0, statsRef.current.boardSlots - s.tickets.open.length)
        return {
          ...s,
          tickets: { ...s.tickets, open: [...s.tickets.open, ...spawned] },
        }
      })
    }, TICKET_SPAWN_MS)
    return () => clearInterval(t)
  }, [])

  // Junior PM: auto-pick the next ticket when idle. Prefers typing work,
  // will hand you a Fix-It, refuses to open WordBuildr on your behalf.
  useEffect(() => {
    const t = setInterval(() => {
      if (!statsRef.current.autoPick) return
      setState((s) => {
        if (!s.toggles.autoPick || s.tickets.active) return s
        const candidates = s.tickets.open.filter(
          (t) => t.type !== 'clientRequest'
        )
        const ticket =
          candidates.find((t) => t.type !== 'bugfix') ?? candidates[0]
        if (!ticket) return s
        return {
          ...s,
          activeTypos: 0,
          tickets: {
            ...s.tickets,
            open: s.tickets.open.filter((t) => t.id !== ticket.id),
            active: ticket,
          },
        }
      })
    }, 2000)
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
          const mult =
            (client?.tags.includes('nitpicky') ? 2 : 1) *
            (1 + s.unmaintainability / 50)
          return Math.random() < DISCOVERY_CHANCE * mult
        })
        if (!found) return s
        return {
          ...s,
          codebase: s.codebase.filter((b) => b !== found),
          reputation: clampRep(s.reputation - 2, repFloorRef.current),
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

  // Product economy tick: relevance decay, sales, SaaS maintenance.
  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => {
        if (s.products.length === 0) return s
        let income = 0
        const products = s.products.map((p) => {
          const r = tickProduct(p)
          income += r.income
          return r.product
        })
        // SaaS maintenance can outrun the wallet; money floors at 0 and the
        // shortfall churns subscribers (you stopped paying the servers).
        let money = s.currencies.money + income
        if (money < 0) {
          const shortfall = -money
          money = 0
          products.forEach((p, i) => {
            if (p.model === 'saas')
              products[i] = {
                ...p,
                subscribers: Math.max(0, p.subscribers - shortfall * 0.05),
              }
          })
        }
        return {
          ...s,
          currencies: { ...s.currencies, money },
          lifetimeScore: s.lifetimeScore + Math.max(0, income) * 2,
        }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // The ecosystem moves on: owned frameworks eventually deprecate.
  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => {
        const entry = Object.entries(s.frameworks).find(
          ([, f]) =>
            !f.deprecated &&
            Date.now() - f.boughtAt > FRAMEWORK_FRESH_MS &&
            Math.random() < 0.25
        )
        if (!entry) return s
        const [id, f] = entry
        const u = UPGRADES.find((x) => x.id === id)
        const headline = DEPRECATION_HEADLINES[
          Math.floor(Math.random() * DEPRECATION_HEADLINES.length)
        ](u.name.replace('Framework: ', ''))
        return {
          ...s,
          frameworks: { ...s.frameworks, [id]: { ...f, deprecated: true } },
          news: headline,
        }
      })
    }, 30000)
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
        currencies: {
          ...s.currencies,
          loc: Math.max(0, s.currencies.loc + gained),
        },
        lifetimeLoc: s.lifetimeLoc + Math.max(0, gained),
        lifetimeScore: s.lifetimeScore + Math.max(0, gained),
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
      reputation: clampRep(s.reputation - 1, repFloorRef.current),
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
      const rate = shipRate(s.era, effectiveProficiency(s, s.era))
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
      const unm =
        done.type === 'bugfix'
          ? Math.max(0, s.unmaintainability - 2)
          : s.unmaintainability
      return {
        ...s,
        unmaintainability: unm,
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
        reputation: clampRep(s.reputation + repDelta, repFloorRef.current),
        activeTypos: 0,
        tickets: {
          ...s.tickets,
          active: null,
          completedCount: s.tickets.completedCount + 1,
        },
      }
    })
  }

  // Rage-quit WordBuildr: the ticket becomes a big typing job at bonus pay.
  // Cathartic. (Page Builder Hell, DESIGN.md.)
  function rewriteTicket() {
    setState((s) => {
      const t = s.tickets.active
      if (!t || t.type !== 'clientRequest') return s
      return {
        ...s,
        tickets: {
          ...s.tickets,
          active: {
            ...t,
            type: 'feature',
            payMoney: Math.round(t.payMoney * 1.5),
            rewrite: true,
          },
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
      const eraOrder = getEra(s.era).order
      const xpGain = Math.round((s.proficiency[s.era] ?? 0) * (eraOrder + 1) * 1.5)
      return {
        ...s,
        era: next.id,
        xp: s.xp + xpGain,
        news: `You've learned ${next.name.replace(' Era', '')}. God help you. (+${xpGain} XP)`,
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

  function toggleAutomation(key) {
    setState((s) => ({
      ...s,
      toggles: { ...s.toggles, [key]: !s.toggles[key] },
    }))
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
        frameworks:
          upgrade.type === 'framework'
            ? {
                ...s.frameworks,
                [upgradeId]: { boughtAt: Date.now(), deprecated: false },
              }
            : s.frameworks,
      }
    })
  }

  function buyXp(upgradeId) {
    const upgrade = XP_UPGRADES.find((u) => u.id === upgradeId)
    setState((s) => {
      const n = s.xpOwned[upgradeId] ?? 0
      const cost = xpUpgradeCost(upgrade, n)
      if (n >= upgrade.max || s.xp < cost) return s
      return {
        ...s,
        xp: s.xp - cost,
        xpOwned: { ...s.xpOwned, [upgradeId]: n + 1 },
      }
    })
  }

  // ---- Products (spend LoC to build/maintain, earn Money) ----

  function startProduct() {
    setState((s) => {
      if (s.currencies.money < PRODUCT_ECONOMY.createCostMoney) return s
      return {
        ...s,
        currencies: {
          ...s.currencies,
          money: s.currencies.money - PRODUCT_ECONOMY.createCostMoney,
        },
        products: [...s.products, newProduct(s.era)],
      }
    })
  }

  function productAction(productId, action) {
    setState((s) => {
      const E = PRODUCT_ECONOMY
      const i = s.products.findIndex((p) => p.id === productId)
      if (i < 0) return s
      const p = s.products[i]
      let { loc, money } = s.currencies
      let next = p

      if (action === 'invest' && !p.model) {
        if (loc < E.investChunk) return s
        loc -= E.investChunk
        // paid now, built over time (devSpeed LoC/s)
        next = { ...p, queued: (p.queued ?? 0) + E.investChunk }
      } else if (action.startsWith('launch:')) {
        if (p.model || p.invested < E.buildBudgetLoc) return s
        const model = action.split(':')[1]
        next = {
          ...p,
          model,
          relevance: 100,
          // launch day brings the first believers
          subscribers: model === 'saas' ? E.saas.launchSubscribers : 0,
          customers: model === 'yearly' ? E.yearly.launchCustomers : 0,
        }
      } else if (action === 'update' && p.model) {
        if (loc < E.updateCostLoc) return s
        loc -= E.updateCostLoc
        next = {
          ...p,
          relevance: Math.min(100, p.relevance + E.updateRelevance),
        }
      } else if (action === 'release' && p.model) {
        if (loc < E.releaseCostLoc) return s
        loc -= E.releaseCostLoc
        next = { ...p, relevance: 100, saturation: 0 }
      } else if (action === 'market' && p.model) {
        if (money < E.marketingCostMoney) return s
        money -= E.marketingCostMoney
        next = { ...p, marketingUntil: Date.now() + E.marketingDurationMs }
      } else if (action === 'retire') {
        return {
          ...s,
          products: s.products.filter((x) => x.id !== productId),
          // retired products feed the Legacy formula (an "exit")
          lifetimeScore:
            s.lifetimeScore + (p.subscribers + p.customers) * 50 + p.invested,
        }
      } else {
        return s
      }
      const products = [...s.products]
      products[i] = next
      return { ...s, currencies: { loc, money }, products }
    })
  }

  // AI review: a bad hunk shipped. The codebase remembers.
  function shipBadHunk() {
    setState((s) => {
      const client = pickRandom(clientsForEra(s.era))
      return {
        ...s,
        unmaintainability: Math.min(100, s.unmaintainability + 5),
        codebase: [
          ...s.codebase,
          { clientId: client.id, era: s.era, createdAt: Date.now() },
        ],
      }
    })
  }

  // Hard prestige: bank pending Legacy, restart the career from 1998.
  // Legacy and perks survive; perks shape the fresh start.
  function ascend() {
    setState((s) => {
      const banked = s.legacy.banked + pendingLegacy(s)
      const perks = deriveLegacyStats(s.legacyOwned)
      const fresh = emptyState()
      fresh.legacy = { banked }
      fresh.legacyOwned = s.legacyOwned
      fresh.reputation = perks.startReputation
      if (perks.startKeyboards > 0)
        fresh.owned = { 'mech-keyboard': perks.startKeyboards }
      fresh.tickets.open = [createTicket(fresh.era, 0)]
      return fresh
    })
  }

  function buyLegacy(perkId) {
    const perk = LEGACY_PERKS.find((p) => p.id === perkId)
    setState((s) => {
      const n = s.legacyOwned[perkId] ?? 0
      const cost = legacyPerkCost(perk, n)
      if (n >= perk.max || s.legacy.banked < cost) return s
      return {
        ...s,
        legacy: { banked: s.legacy.banked - cost },
        legacyOwned: { ...s.legacyOwned, [perkId]: n + 1 },
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
    rewriteTicket,
    buy,
    buyXp,
    toggleAutomation,
    startProduct,
    productAction,
    shipBadHunk,
    ascend,
    buyLegacy,
    reset,
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
