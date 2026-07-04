import { useCallback } from 'react'
import { useGameState, pendingLegacy } from './useGameState.js'
import { UPGRADES, upgradeCost } from './upgrades.js'
import { CLIENTS } from './data/clients.js'
import { ticketTypeName } from './tickets.js'
import TypingPane from './TypingPane.jsx'
import TicketBoard from './TicketBoard.jsx'
import './App.css'

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
  return Math.floor(n).toString()
}

function ShopSection({ title, currency, symbol, state, buy }) {
  return (
    <>
      <h2>{title}</h2>
      {UPGRADES.filter((u) => u.currency === currency).map((u) => {
        const n = state.owned[u.id] ?? 0
        const cost = upgradeCost(u, n)
        const maxed = n >= u.max
        return (
          <button
            key={u.id}
            className="upgrade"
            disabled={maxed || state.currencies[currency] < cost}
            onClick={() => buy(u.id)}
          >
            <span className="upgrade-name">
              {u.name} {n > 0 && <em>x{n}</em>}
            </span>
            <span className="upgrade-desc">{u.desc}</span>
            <span className="upgrade-cost">
              {maxed ? 'MAXED' : `${symbol}${fmt(cost)}`}
            </span>
          </button>
        )
      })}
    </>
  )
}

export default function App() {
  const {
    state,
    stats,
    earn,
    pickTicket,
    abandonTicket,
    completeTicket,
    buy,
    reset,
  } = useGameState()
  // stable identities for TypingPane's keydown effect
  const onEarn = useCallback(earn, []) // eslint-disable-line react-hooks/exhaustive-deps
  const onComplete = useCallback(completeTicket, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ticket = state.tickets.active
  const client = ticket && CLIENTS.find((c) => c.id === ticket.clientId)
  const legacy = pendingLegacy(state)

  return (
    <div className="app">
      <header>
        <h1>~/typing-terminal</h1>
        <div className="currency">
          <span className="loc">{fmt(state.currencies.loc)} LoC</span>
          <span className="money">${fmt(state.currencies.money)}</span>
          <span className="legacy" title="Pending Legacy — banked when you ascend (coming soon)">
            ☆ {legacy}
          </span>
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
        <section>
          {ticket ? (
            <>
              <div className="ticket-header">
                <span className="ticket-type">{ticketTypeName(ticket)}</span>
                <span className="ticket-client">{client.name}</span>
                <span className="ticket-pay">pays ${fmt(ticket.payMoney)}</span>
                <button className="abandon" onClick={abandonTicket}>
                  abandon
                </button>
              </div>
              <TypingPane
                snippet={ticket.snippet}
                stats={stats}
                onEarn={onEarn}
                onComplete={onComplete}
              />
            </>
          ) : (
            <div className="no-ticket">Pick a ticket from the board to start typing.</div>
          )}

          <TicketBoard
            tickets={state.tickets.open}
            slots={stats.boardSlots}
            canPick={!ticket}
            onPick={pickTicket}
          />
        </section>

        <aside className="shop">
          <ShopSection
            title="Skills (LoC)"
            currency="loc"
            symbol=""
            state={state}
            buy={buy}
          />
          <ShopSection
            title="Business ($)"
            currency="money"
            symbol="$"
            state={state}
            buy={buy}
          />
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
