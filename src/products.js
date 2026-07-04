import { PRODUCT_IDEAS, PRODUCT_ECONOMY as E, SAAS_INCIDENTS } from './data/products.js'
import { getEra } from './data/eras.js'

export function newProduct(eraId) {
  const ideas = PRODUCT_IDEAS[eraId] ?? PRODUCT_IDEAS.spa
  const idea = ideas[Math.floor(Math.random() * ideas.length)]
  return {
    id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: idea.name,
    appeal: idea.appeal,
    era: eraId,
    invested: 0, // LoC actually built into the product
    queued: 0, // LoC paid in, waiting on dev time (devSpeed/s)
    lastIncome: 0, // last tick's net $/s, for the UI
    model: null, // set at launch
    relevance: 100,
    saturation: 0, // one-off market saturation 0..1
    customers: 0, // yearly
    subscribers: 0, // saas
    marketingUntil: 0,
  }
}

// One economy tick (1s). Development applies queued LoC over time; launched
// products earn (or bleed) money.
// Returns { product, income } — income may be negative (SaaS maintenance).
export function tickProduct(p) {
  if (!p.model) {
    const queued = p.queued ?? 0
    if (queued <= 0) return { product: p, income: 0 }
    const applied = Math.min(E.devSpeed, queued)
    return {
      product: { ...p, queued: queued - applied, invested: p.invested + applied },
      income: 0,
    }
  }
  const eraOrder = getEra(p.era).order
  const rel = Math.max(
    0,
    p.relevance - E.relevanceDecayPerEraOrder * (eraOrder + 1)
  )
  const relFactor = rel / 100
  const boost = Date.now() < p.marketingUntil ? E.marketingBoost : 1
  let income = 0
  const next = { ...p, relevance: rel }

  if (p.model === 'oneoff') {
    const sales =
      E.oneoff.salesRate * p.appeal * relFactor * (1 - p.saturation) * boost
    income = sales * E.oneoff.pricePerAppeal * p.appeal
    next.saturation = Math.min(1, p.saturation + sales * E.oneoff.saturationPerSale)
  } else if (p.model === 'yearly') {
    next.customers =
      p.customers + E.yearly.customerGrowth * p.appeal * relFactor * boost
    // renewals dry up as relevance dies
    income = next.customers * E.yearly.pricePerAppeal * p.appeal * relFactor
  } else if (p.model === 'saas') {
    // separate in/out so the UI can show honest up-and-down pricing
    next.subscribers = Math.max(
      0,
      p.subscribers +
        (E.saas.signupRate + p.subscribers * E.saas.wordOfMouth) *
          p.appeal * relFactor * boost -
        // relevance rot causes churn
        p.subscribers * (1 - relFactor) * 0.002
    )
    const revenue = next.subscribers * E.saas.feePerAppeal * p.appeal
    let maintenance =
      E.saas.baseMaintenance + next.subscribers * E.saas.maintenancePerSub
    // Ops roulette: sometimes the pager goes off.
    if (Math.random() < E.saas.incidentChancePerSec) {
      const cost = Math.round(
        E.saas.incidentCostBase + next.subscribers * E.saas.incidentCostPerSub
      )
      maintenance += cost
      next.lastIncident = {
        text: SAAS_INCIDENTS[Math.floor(Math.random() * SAAS_INCIDENTS.length)],
        cost,
        at: Date.now(),
      }
    }
    next.lastRevenue = revenue
    next.lastCost = maintenance
    income = revenue - maintenance
  }
  next.lastIncome = income
  return { product: next, income }
}
