import { BUSINESS_MODELS, PRODUCT_ECONOMY as E } from './data/products.js'

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
              </div>
              <div className="product-actions">
                <span className="product-stat">
                  {fmt(p.invested)}/{fmt(E.buildBudgetLoc)} LoC built
                </span>
                {p.invested < E.buildBudgetLoc ? (
                  <button
                    disabled={currencies.loc < E.investChunk}
                    onClick={() => onAction(p.id, 'invest')}
                  >
                    invest {E.investChunk} LoC
                  </button>
                ) : (
                  BUSINESS_MODELS.map((m) => (
                    <button
                      key={m.id}
                      title={m.desc}
                      onClick={() => onAction(p.id, `launch:${m.id}`)}
                    >
                      launch: {m.name}
                    </button>
                  ))
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
                  <span>{fmt(p.customers)} licensees</span>
                )}
                {p.model === 'saas' && (
                  <span>{fmt(p.subscribers)} subscribers</span>
                )}
                {Date.now() < p.marketingUntil && <span>📣 campaign live</span>}
              </div>
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
