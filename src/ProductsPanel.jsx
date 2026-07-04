import { BUSINESS_MODELS, PRODUCT_ECONOMY as E } from './data/products.js'

function fmtUsers(n) {
  return n < 100 ? n.toFixed(1) : fmt(n)
}

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
  return Math.floor(n).toString()
}

export default function ProductsPanel({ state, onStart, onAction }) {
  const { products, currencies } = state
  return (
    <div className="products">
      <h2>
        Products
        <button
          className="product-new"
          disabled={currencies.money < E.createCostMoney}
          onClick={onStart}
          title="Spin up a side project. Building it costs LoC; selling it earns $."
        >
          + new product (${fmt(E.createCostMoney)})
        </button>
      </h2>
      {products.length === 0 && (
        <p className="board-empty">
          No products yet. Every dev has a side project — start yours.
        </p>
      )}
      {products.map((p) => (
        <div key={p.id} className="product-card">
          <div className="product-title">
            <strong>{p.name}</strong>
            <span className="product-model">
              {p.model
                ? BUSINESS_MODELS.find((m) => m.id === p.model).name
                : 'in development'}
            </span>
            <button
              className="abandon"
              onClick={() => onAction(p.id, 'retire')}
            >
              retire
            </button>
          </div>

          {!p.model ? (
            <>
              <div className="product-bar">
                <div
                  className="product-bar-fill"
                  style={{
                    width: `${Math.min(100, (p.invested / E.buildBudgetLoc) * 100)}%`,
                  }}
                />
                <div
                  className="product-bar-queued"
                  style={{
                    left: `${Math.min(100, (p.invested / E.buildBudgetLoc) * 100)}%`,
                    width: `${Math.min(100 - (p.invested / E.buildBudgetLoc) * 100, ((p.queued ?? 0) / E.buildBudgetLoc) * 100)}%`,
                  }}
                />
              </div>
              <div className="product-actions">
                <span className="product-stat">
                  {fmt(p.invested)}/{fmt(E.buildBudgetLoc)} LoC built
                  {(p.queued ?? 0) > 0 &&
                    ` — ${fmt(p.queued)} queued, ~${Math.ceil(p.queued / E.devSpeed)}s of dev`}
                </span>
                {p.invested + (p.queued ?? 0) < E.buildBudgetLoc ? (
                  <button
                    disabled={currencies.loc < E.investChunk}
                    onClick={() => onAction(p.id, 'invest')}
                  >
                    invest {E.investChunk} LoC
                  </button>
                ) : p.invested < E.buildBudgetLoc ? (
                  <span className="product-stat">developing…</span>
                ) : (
                  <span className="launch-row">
                    {BUSINESS_MODELS.map((m) => (
                      <button
                        key={m.id}
                        title={m.desc}
                        onClick={() => onAction(p.id, `launch:${m.id}`)}
                      >
                        launch: {m.name}
                        <em className="launch-terms">
                          {m.id === 'oneoff' &&
                            `~$${Math.round(E.oneoff.pricePerAppeal * p.appeal)}/sale`}
                          {m.id === 'yearly' &&
                            `~$${(E.yearly.pricePerAppeal * p.appeal).toFixed(2)}/licensee/s`}
                          {m.id === 'saas' &&
                            `+$${(E.saas.feePerAppeal * p.appeal).toFixed(2)}/sub/s − upkeep $${E.saas.baseMaintenance.toFixed(2)}/s + $${E.saas.maintenancePerSub.toFixed(2)}/sub/s`}
                        </em>
                      </button>
                    ))}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="product-stats">
                <span
                  className={p.relevance < 30 ? 'debt-high' : undefined}
                  title="Relevance decays constantly; updates and releases restore it."
                >
                  relevance {Math.round(p.relevance)}%
                </span>
                {p.model === 'oneoff' && (
                  <span>market {Math.round((1 - p.saturation) * 100)}% fresh</span>
                )}
                {p.model === 'yearly' && (
                  <span>{fmtUsers(p.customers)} licensees</span>
                )}
                {p.model === 'saas' && (
                  <span>{fmtUsers(p.subscribers)} subscribers</span>
                )}
                {p.model === 'saas' && (
                  <span className="income-split" title="Money in vs. money out, per second.">
                    <span className="income-pos">▲ ${ (p.lastRevenue ?? 0).toFixed(2) }/s</span>{' '}
                    <span className="income-neg">▼ ${ (p.lastCost ?? 0).toFixed(2) }/s</span>
                  </span>
                )}
                <span
                  className={p.lastIncome >= 0 ? 'income-pos' : 'income-neg'}
                  title={
                    p.model === 'saas'
                      ? 'Subscriptions minus server/support maintenance. Negative until subscribers compound.'
                      : 'Net earnings per second.'
                  }
                >
                  {p.lastIncome >= 0 ? '+' : '−'}$
                  {Math.abs(p.lastIncome ?? 0).toFixed(2)}/s
                </span>
                {Date.now() < p.marketingUntil && (
                  <span className="campaign">
                    📣 {Math.max(0, Math.ceil((p.marketingUntil - Date.now()) / 1000))}s left
                  </span>
                )}
              </div>
              {p.lastIncident && Date.now() - p.lastIncident.at < 30000 && (
                <div className="incident">
                  ⚡ {p.lastIncident.text} (−${fmt(p.lastIncident.cost)})
                </div>
              )}
              <div className="product-actions">
                <button
                  disabled={currencies.loc < E.updateCostLoc}
                  onClick={() => onAction(p.id, 'update')}
                  title={`+${E.updateRelevance} relevance`}
                >
                  update ({fmt(E.updateCostLoc)} LoC)
                </button>
                <button
                  disabled={currencies.loc < E.releaseCostLoc}
                  onClick={() => onAction(p.id, 'release')}
                  title="Relevance to 100, market reset"
                >
                  major release ({fmt(E.releaseCostLoc)} LoC)
                </button>
                <button
                  disabled={currencies.money < E.marketingCostMoney}
                  onClick={() => onAction(p.id, 'market')}
                  title="90s demand boost"
                >
                  market (${fmt(E.marketingCostMoney)})
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
