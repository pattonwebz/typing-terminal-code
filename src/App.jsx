import { useCallback, useEffect, useState } from 'react'
import {
  useGameState,
  pendingLegacy,
  effectiveProficiency,
  techDebt,
  TECH_DEBT_SOFT_CAP,
} from './useGameState.js'
import {
  LEGACY_PERKS,
  legacyPerkCost,
  deriveLegacyStats,
} from './data/legacyPerks.js'
import AIReviewPane from './AIReviewPane.jsx'
import { upgradeCost, visibleUpgrades } from './upgrades.js'
import { XP_UPGRADES, xpUpgradeCost } from './data/xpUpgrades.js'
import { CLIENTS } from './data/clients.js'
import { getEra, nextEra } from './data/eras.js'
import { ticketTypeName } from './tickets.js'
import TypingPane from './TypingPane.jsx'
import FixItPane from './FixItPane.jsx'
import WordBuildr from './WordBuildr.jsx'
import TicketBoard from './TicketBoard.jsx'
import ProductsPanel from './ProductsPanel.jsx'
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
      {visibleUpgrades(state.era)
        .filter((u) => u.currency === currency)
        .map((u) => {
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
    noteTypo,
    pickTicket,
    abandonTicket,
    completeTicket,
    rewriteTicket,
    advanceEra,
    buy,
    buyXp,
    startProduct,
    productAction,
    shipBadHunk,
    ascend,
    buyLegacy,
    reset,
  } = useGameState()
  // AI-era flow: after typing the prompt, review the AI's hunks.
  const [reviewing, setReviewing] = useState(false)
  // stable identities for TypingPane's keydown effect
  const onEarn = useCallback(earn, []) // eslint-disable-line react-hooks/exhaustive-deps
  const onComplete = useCallback(() => {
    setReviewing(false)
    completeTicket()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const onMiss = useCallback(noteTypo, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ticket = state.tickets.active
  const client = ticket && CLIENTS.find((c) => c.id === ticket.clientId)
  const legacy = pendingLegacy(state)
  const debt = techDebt(state)
  const legacyStats = deriveLegacyStats(state.legacyOwned)
  const effProf = effectiveProficiency(state, state.era)

  const era = getEra(state.era)
  const next = nextEra(state.era)
  const eraDone = state.proficiency[state.era] ?? 0
  const eraReady =
    era.ticketsToAdvance != null && next && eraDone >= era.ticketsToAdvance

  // Era themes hook onto this attribute (see App.css [data-era] blocks).
  useEffect(() => {
    document.documentElement.dataset.era = state.era
  }, [state.era])

  return (
    <div className="app">
      <header>
        <h1>
          ~/typing-terminal
          <span className="era-badge">
            {era.name} · {era.year}
          </span>
        </h1>
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

      <div className="status-row">
        <span title="Reputation: clean work raises it, discovered bugs bleed it. Scales ticket pay.">
          rep {'★'.repeat(Math.round(state.reputation / 20)) || '☆'}{' '}
          {Math.round(state.reputation)}/100
        </span>
        <span
          className={debt > TECH_DEBT_SOFT_CAP ? 'debt-high' : undefined}
          title="Tech debt: dormant + open bugs. Above the cap, typing earnings suffer."
        >
          tech debt {debt}/{TECH_DEBT_SOFT_CAP}
          {debt > TECH_DEBT_SOFT_CAP && ' — earnings −25%'}
        </span>
        {state.unmaintainability > 0 && (
          <span
            className={state.unmaintainability > 40 ? 'debt-high' : undefined}
            title="Unmaintainable code: it works, but every future bug costs more. Bugfixes chip away at it."
          >
            unmaintainable {Math.round(state.unmaintainability)}%
          </span>
        )}
        {legacy > 0 && (
          <button
            className="ascend"
            title="Bank pending Legacy and restart from 1998. Legacy perks persist forever."
            onClick={() =>
              confirm(
                `Ascend? You bank ☆${legacy} Legacy (total ☆${state.legacy.banked + legacy}) and start a new career in the HTML era. Perks persist; everything else resets.`
              ) && ascend()
            }
          >
            ascend (bank ☆{legacy})
          </button>
        )}
      </div>

      {state.offlineEarned > 0 && (
        <div className="offline-banner">
          Your interns wrote {fmt(state.offlineEarned)} LoC while you were away.
        </div>
      )}

      {era.ticketsToAdvance != null && next && (
        <div className="era-progress">
          <div className="era-progress-label">
            <span>
              {era.name}: {Math.min(eraDone, era.ticketsToAdvance)}/
              {era.ticketsToAdvance} tickets to {next.name}
            </span>
            {eraReady && (
              <button
                className="era-advance"
                onClick={() =>
                  confirm(
                    `Move on to the ${next.name}? New tech, new clients, new bugs.`
                  ) && advanceEra()
                }
              >
                Advance to {next.name} →
              </button>
            )}
          </div>
          <div className="era-progress-bar">
            <div
              className="era-progress-fill"
              style={{
                width: `${Math.min(100, (eraDone / era.ticketsToAdvance) * 100)}%`,
              }}
            />
          </div>
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
              {ticket.type === 'clientRequest' ? (
                <WordBuildr
                  ticket={ticket}
                  rageDiscount={legacyStats.rageDiscount}
                  onComplete={onComplete}
                  onRewrite={rewriteTicket}
                />
              ) : ticket.type === 'bugfix' ? (
                <FixItPane
                  ticket={ticket}
                  stats={stats}
                  // Half-mastered era: you can spot your classic mistakes.
                  highlightBugs={
                    effProf >=
                    (era.proficiency.ticketsToMaster / 2) *
                      legacyStats.highlightFactor
                  }
                  onEarn={onEarn}
                  onComplete={onComplete}
                />
              ) : (
                state.era === 'ai' && reviewing ? (
                  <AIReviewPane
                    ticket={ticket}
                    proficient={effProf >= era.proficiency.ticketsToMaster / 3}
                    onEarn={onEarn}
                    onShipBad={shipBadHunk}
                    onComplete={onComplete}
                  />
                ) : (
                  <TypingPane
                    snippet={ticket.snippet}
                    stats={stats}
                    onEarn={onEarn}
                    onComplete={
                      state.era === 'ai' ? () => setReviewing(true) : onComplete
                    }
                    onMiss={onMiss}
                  />
                )
              )}
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

          <ProductsPanel
            state={state}
            onStart={startProduct}
            onAction={productAction}
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
          {(state.xp > 0 || Object.keys(state.xpOwned).length > 0) && (
            <>
              <h2>Experience ({state.xp} XP)</h2>
              {XP_UPGRADES.map((u) => {
                const n = state.xpOwned[u.id] ?? 0
                const cost = xpUpgradeCost(u, n)
                const maxed = n >= u.max
                return (
                  <button
                    key={u.id}
                    className="upgrade"
                    disabled={maxed || state.xp < cost}
                    onClick={() => buyXp(u.id)}
                  >
                    <span className="upgrade-name">
                      {u.name} {n > 0 && <em>x{n}</em>}
                    </span>
                    <span className="upgrade-desc">{u.desc}</span>
                    <span className="upgrade-cost">
                      {maxed ? 'MAXED' : `${cost} XP`}
                    </span>
                  </button>
                )
              })}
            </>
          )}
          {(state.legacy.banked > 0 ||
            Object.keys(state.legacyOwned).length > 0) && (
            <>
              <h2>Legacy (☆{state.legacy.banked} banked)</h2>
              {LEGACY_PERKS.map((u) => {
                const n = state.legacyOwned[u.id] ?? 0
                const cost = legacyPerkCost(u, n)
                const maxed = n >= u.max
                return (
                  <button
                    key={u.id}
                    className="upgrade"
                    disabled={maxed || state.legacy.banked < cost}
                    onClick={() => buyLegacy(u.id)}
                  >
                    <span className="upgrade-name">
                      {u.name} {n > 0 && <em>x{n}</em>}
                    </span>
                    <span className="upgrade-desc">{u.desc}</span>
                    <span className="upgrade-cost">
                      {maxed ? 'MAXED' : `☆${cost}`}
                    </span>
                  </button>
                )
              })}
            </>
          )}
          <button
            className="reset"
            onClick={() => confirm('Wipe save?') && reset()}
          >
            hard reset
          </button>
        </aside>
      </main>

      <footer>
        <span className="era-tagline">“{era.tagline}”</span>
        {state.news && <span className="news-ticker">📰 {state.news}</span>}
        {state.era === 'html' && (
          <span className="visitor-counter">
            You are visitor #
            {String(Math.floor(state.lifetimeLoc)).padStart(6, '0')}
          </span>
        )}
      </footer>
    </div>
  )
}
