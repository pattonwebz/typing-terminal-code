import { getEra } from './data/eras.js'
import { clientsForEra } from './data/clients.js'
import { TICKET_TYPES, getTicketType } from './data/ticketTypes.js'
import { randomSnippet } from './snippets.js'

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
//   deadline?, shippedBugs[] }
// LoC is paid live per keystroke by the typing engine; payMoney on completion.
export function createTicket(eraId, totalLoc, excludeCode) {
  const era = getEra(eraId)
  const type = weightedType()
  const client = pick(clientsForEra(eraId))
  const snippet = randomSnippet(totalLoc, excludeCode)
  return {
    id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    type: type.id,
    clientId: client.id,
    era: eraId,
    snippet,
    payMoney: Math.round(
      snippet.code.length * type.moneyPerChar * era.payMultiplier
    ),
    createdAt: Date.now(),
    deadline: null,
    shippedBugs: [],
  }
}

export function ticketTypeName(ticket) {
  return getTicketType(ticket.type).name
}
