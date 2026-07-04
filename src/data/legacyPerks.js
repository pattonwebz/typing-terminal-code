// Legacy perk tree: bought with banked Legacy, permanent across careers.
export const LEGACY_PERKS = [
  {
    id: 'muscle-memory',
    name: 'Muscle Memory',
    desc: 'Start each era with 5 tickets of proficiency per level',
    value: 5,
    baseCost: 3,
    costGrowth: 2,
    max: 4,
  },
  {
    id: 'industry-contacts',
    name: 'Industry Contacts',
    desc: 'Start careers at 65 reputation',
    value: 65,
    baseCost: 5,
    costGrowth: 1,
    max: 1,
  },
  {
    id: 'dotfiles',
    name: 'Dotfiles',
    desc: 'Start careers with 3 Mechanical Keyboards',
    value: 3,
    baseCost: 4,
    costGrowth: 1,
    max: 1,
  },
  {
    id: 'seen-this-before',
    name: "“I've Seen This Before”",
    desc: 'Fix-It bugs highlighted at half the usual mastery',
    value: 0.5,
    baseCost: 6,
    costGrowth: 1,
    max: 1,
  },
  {
    id: 'battle-scars',
    name: 'Battle Scars',
    desc: 'WordBuildr rage meter fills one click sooner',
    value: 1,
    baseCost: 4,
    costGrowth: 2,
    max: 2,
  },
  {
    id: 'rep-precedes',
    name: 'Reputation Precedes You',
    desc: '+15 permanent reputation floor',
    value: 15,
    baseCost: 8,
    costGrowth: 1,
    max: 1,
  },
]

export function legacyPerkCost(perk, owned) {
  return Math.round(perk.baseCost * perk.costGrowth ** owned)
}

export function deriveLegacyStats(legacyOwned) {
  const s = {
    startProficiency: 0,
    startReputation: 50,
    startKeyboards: 0,
    highlightFactor: 1,
    rageDiscount: 0,
    repFloor: 0,
  }
  for (const p of LEGACY_PERKS) {
    const n = legacyOwned?.[p.id] ?? 0
    if (n === 0) continue
    if (p.id === 'muscle-memory') s.startProficiency += p.value * n
    if (p.id === 'industry-contacts') s.startReputation = p.value
    if (p.id === 'dotfiles') s.startKeyboards = p.value
    if (p.id === 'seen-this-before') s.highlightFactor = p.value
    if (p.id === 'battle-scars') s.rageDiscount += p.value * n
    if (p.id === 'rep-precedes') s.repFloor += p.value * n
  }
  return s
}
