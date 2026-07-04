import { PRODUCT_IDEAS, PRODUCT_ECONOMY as E } from './data/products.js'
import { getEra } from './data/eras.js'

export function newProduct(eraId) {
  const ideas = PRODUCT_IDEAS[eraId] ?? PRODUCT_IDEAS.spa
  const idea = ideas[Math.floor(Math.random() * ideas.length)]
  return {
    id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: idea.name,
    appeal: idea.appeal,
    era: eraId,
    invested: 0,
    model: null, // set at launch
    relevance: 100,
    saturation: 0, // one-off market saturation 0..1
    customers: 0, // yearly
    subscribers: 0, // saas
    marketingUntil: 0,
  }
}

// One economy tick (1s) for a launched product.
// Returns { product, income } — income may be negative (SaaS maintenance).
export function tickProduct(p) {
  if (!p.model) return { product: p, income: 0 }
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
    next.subscribers = Math.max(
      0,
      p.subscribers +
        (1 + p.subscribers) * E.saas.subscriberGrowth * p.appeal * relFactor * boost -
        // relevance rot causes churn
        p.subscribers * (1 - relFactor) * 0.002
    )
    const revenue = next.subscribers * E.saas.feePerAppeal * p.appeal
    const maintenance =
      E.saas.baseMaintenance + next.subscribers * E.saas.maintenancePerSub
    income = revenue - maintenance
  }
  return { product: next, income }
}
