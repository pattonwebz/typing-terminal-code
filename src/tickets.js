import { getEra } from './data/eras.js'
import { CLIENTS, clientsForEra } from './data/clients.js'
import { TICKET_TYPES, getTicketType } from './data/ticketTypes.js'
import { randomSnippet } from './snippets.js'
import { injectBugs } from './bugInjector.js'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedType() {
  const pool = TICKET_TYPES.filter((t) => t.enabled && t.spawnWeight > 0)
  const total = pool.reduce((s, t) => s + t.spawnWeight, 0)
  let r = Math.random() * total
  for (const t of pool) {
    r -= t.spawnWeight
    if (r <= 0) return t
  }
  return pool[0]
}

// Ticket shape (DESIGN.md / TASKS.md step 1):
// { id, type, clientId, era, snippet, payMoney, createdAt,
//   deadline?, shippedBugs[] } (+ buggyCode/bugs on Fix-It tickets)
// LoC is paid live per keystroke by the typing engine; payMoney on completion.
// options: { type, clientId, reputation } — reputation scales Money pay
// (0.5x at rep 0 → 1.5x at rep 100).
export function createTicket(eraId, totalLoc, excludeCode, options = {}) {
  const era = getEra(eraId)
  const type = options.type ? getTicketType(options.type) : weightedType()
  const client = options.clientId
    ? CLIENTS.find((c) => c.id === options.clientId)
    : pick(clientsForEra(eraId))
  const snippet = randomSnippet(era.snippetPool, totalLoc, excludeCode)
  const repMult = 0.5 + (options.reputation ?? 50) / 100
  // Fix-It tickets ship pre-broken: 2–5 bugs depending on snippet size.
  const fixit =
    type.id === 'bugfix'
      ? injectBugs(snippet.code, Math.min(5, 2 + Math.floor(snippet.code.length / 60)))
      : null
  return {
    id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    type: type.id,
    clientId: client.id,
    era: eraId,
    snippet,
    payMoney: Math.round(
      snippet.code.length * type.moneyPerChar * era.payMultiplier * repMult
    ),
    createdAt: Date.now(),
    deadline: null,
    shippedBugs: [],
    ...(fixit && { buggyCode: fixit.buggyCode, bugs: fixit.bugs }),
  }
}

export function ticketTypeName(ticket) {
  return getTicketType(ticket.type).name
}

// Current ship-rate for an era given tickets completed there: interpolates
// the era's proficiency curve (you get better, then the next era resets you).
export function shipRate(eraId, ticketsDone) {
  const { startShipRate, minShipRate, ticketsToMaster } =
    getEra(eraId).proficiency
  const t = Math.min(1, (ticketsDone ?? 0) / ticketsToMaster)
  return startShipRate - (startShipRate - minShipRate) * t
}
