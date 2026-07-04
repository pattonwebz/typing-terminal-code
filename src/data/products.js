// Software products (DESIGN.md "Software Products").
// Product ideas are era-flavored; building and maintaining them spends LoC
// (the code you actually typed), selling them earns Money.
export const PRODUCT_IDEAS = {
  html: [
    { name: 'HitCounter Pro', appeal: 1.0 },
    { name: 'GuestbookMaster 98', appeal: 0.9 },
  ],
  php: [
    { name: 'phpGuestbook Deluxe', appeal: 1.1 },
    { name: 'ForumInABox', appeal: 1.3 },
  ],
  js: [
    { name: 'jQuery.sparkle', appeal: 1.4 },
    { name: 'SlideRite Carousel', appeal: 1.2 },
  ],
  spa: [
    { name: 'DeployDeck', appeal: 1.8 },
    { name: 'BundleShrink', appeal: 1.6 },
  ],
  ai: [
    { name: 'SummarAIze', appeal: 2.5 },
    { name: 'PromptPolish', appeal: 2.2 },
  ],
}

export const BUSINESS_MODELS = [
  {
    id: 'oneoff',
    name: 'One-off',
    desc: 'Each sale pays once. Fast money, saturates over time.',
  },
  {
    id: 'yearly',
    name: 'Yearly license',
    desc: 'Steady renewals while the product stays relevant.',
  },
  {
    id: 'saas',
    name: 'Monthly SaaS',
    desc: 'Loses money at first — maintenance costs bite. Compounds if kept alive.',
  },
]

// Economy knobs (per 1s tick unless noted).
export const PRODUCT_ECONOMY = {
  createCostMoney: 800,
  buildBudgetLoc: 3000, // LoC to invest before launch
  investChunk: 500, // LoC per invest click
  relevanceDecayPerEraOrder: 0.02, // % points/s, scaled by (eraOrder+1)
  updateCostLoc: 800, // +25 relevance
  updateRelevance: 25,
  releaseCostLoc: 2500, // relevance→100, saturation reset, demand spike
  marketingCostMoney: 1200,
  marketingDurationMs: 90000,
  marketingBoost: 3,
  oneoff: { pricePerAppeal: 40, salesRate: 0.05, saturationPerSale: 0.004 },
  yearly: { pricePerAppeal: 3, customerGrowth: 0.03 },
  saas: {
    feePerAppeal: 0.9,
    subscriberGrowth: 0.004,
    baseMaintenance: 4,
    maintenancePerSub: 0.06,
  },
}
