import { CLIENTS } from './data/clients.js'
import { ticketTypeName } from './tickets.js'

function fmt(n) {
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
  return Math.floor(n).toString()
}

export default function TicketBoard({ tickets, slots, canPick, onPick }) {
  const empty = slots - tickets.length
  return (
    <div className="board">
      <h2>
        Ticket Board
        <span className="board-count">
          {tickets.length}/{slots}
        </span>
      </h2>
      <div className="board-grid">
        {tickets.map((t) => {
          const client = CLIENTS.find((c) => c.id === t.clientId)
          return (
            <button
              key={t.id}
              className="ticket-card"
              disabled={!canPick}
              onClick={() => onPick(t.id)}
            >
              <span className="ticket-type">{ticketTypeName(t)}</span>
              <span className="ticket-card-client">{client.name}</span>
              <span className="ticket-card-blurb">{client.blurb}</span>
              <span className="ticket-card-footer">
                <span>{t.snippet.code.length} chars</span>
                <span className="ticket-pay">${fmt(t.payMoney)}</span>
              </span>
            </button>
          )
        })}
        {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
          <div key={`empty-${i}`} className="ticket-card ticket-empty">
            waiting for tickets…
          </div>
        ))}
      </div>
      {tickets.length === 0 && (
        <p className="board-empty">Inbox zero. Somehow.</p>
      )}
    </div>
  )
}
