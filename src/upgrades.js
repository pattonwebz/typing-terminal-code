// Upgrade definitions. `currency` splits the shop: skill upgrades cost LoC,
// business upgrades cost Money. Costs scale exponentially with count owned.
// `type` determines how the game applies it:
//   perChar    — flat LoC added per correct keystroke
//   multiplier — multiplies all typing earnings
//   critChance — chance a keystroke pays 10x
//   passive    — LoC per second while away or idle
//   comboBoost — combo multiplier grows faster
//   boardSlot  — +1 open-ticket slot on the board
export const UPGRADES = [
  // Skill upgrades (LoC)
  {
    id: 'mech-keyboard',
    name: 'Mechanical Keyboard',
    desc: '+1 LoC per keystroke',
    currency: 'loc',
    type: 'perChar',
    value: 1,
    baseCost: 25,
    costGrowth: 1.6,
    max: 25,
  },
  {
    id: 'coffee',
    name: 'Coffee Machine',
    desc: 'x2 typing earnings',
    currency: 'loc',
    type: 'multiplier',
    value: 2,
    baseCost: 200,
    costGrowth: 5,
    max: 5,
  },
  {
    id: 'autocomplete',
    name: 'Autocomplete Plugin',
    desc: '+5% chance a keystroke pays 10x',
    currency: 'loc',
    type: 'critChance',
    value: 0.05,
    baseCost: 100,
    costGrowth: 2.2,
    max: 10,
  },
  {
    id: 'rubber-duck',
    name: 'Rubber Duck',
    desc: 'Combo grows 50% faster',
    currency: 'loc',
    type: 'comboBoost',
    value: 0.5,
    baseCost: 75,
    costGrowth: 3,
    max: 4,
  },

  // Business upgrades (Money)
  {
    id: 'intern',
    name: 'Hire an Intern',
    desc: '+1 LoC per second, even while away',
    currency: 'money',
    type: 'passive',
    value: 1,
    baseCost: 400,
    costGrowth: 1.8,
    max: 50,
  },
  {
    id: 'better-chair',
    name: 'Better Chair',
    desc: 'x1.5 typing earnings (lumbar support)',
    currency: 'money',
    type: 'multiplier',
    value: 1.5,
    baseCost: 1500,
    costGrowth: 6,
    max: 4,
  },
  {
    id: 'ticket-slot',
    name: 'Second Inbox',
    desc: '+1 ticket slot on the board',
    currency: 'money',
    type: 'boardSlot',
    value: 1,
    baseCost: 5000,
    costGrowth: 4,
    max: 2,
  },
]

export function upgradeCost(upgrade, owned) {
  return Math.round(upgrade.baseCost * upgrade.costGrowth ** owned)
}

// Derive all effective rates from owned-counts, so game state only needs
// to persist { upgradeId: count }.
export function deriveStats(owned) {
  const stats = {
    perChar: 1,
    multiplier: 1,
    critChance: 0,
    passiveRate: 0,
    comboBoost: 1,
    boardSlots: 3,
  }
  for (const u of UPGRADES) {
    const n = owned[u.id] ?? 0
    if (n === 0) continue
    if (u.type === 'perChar') stats.perChar += u.value * n
    if (u.type === 'multiplier') stats.multiplier *= u.value ** n
    if (u.type === 'critChance') stats.critChance += u.value * n
    if (u.type === 'passive') stats.passiveRate += u.value * n
    if (u.type === 'comboBoost') stats.comboBoost += u.value * n
    if (u.type === 'boardSlot') stats.boardSlots += u.value * n
  }
  return stats
}
