// Experience (soft-prestige) upgrades: bought with XP granted at era
// transitions, last for the rest of the current career.
export const XP_UPGRADES = [
  {
    id: 'touch-typing',
    name: 'Touch Typing',
    desc: '+25% typing earnings per level',
    value: 1.25,
    baseCost: 5,
    costGrowth: 2,
    max: 5,
  },
  {
    id: 'networking',
    name: 'Networking',
    desc: '+10 reputation floor per level',
    value: 10,
    baseCost: 8,
    costGrowth: 2.5,
    max: 3,
  },
  {
    id: 'time-management',
    name: 'Time Management',
    desc: 'Tickets appear 25% faster per level',
    value: 0.25,
    baseCost: 6,
    costGrowth: 2,
    max: 3,
  },
]

export function xpUpgradeCost(u, owned) {
  return Math.round(u.baseCost * u.costGrowth ** owned)
}

export function deriveXpStats(xpOwned) {
  const s = { typingMult: 1, repFloor: 0, spawnSpeed: 1 }
  for (const u of XP_UPGRADES) {
    const n = xpOwned?.[u.id] ?? 0
    if (n === 0) continue
    if (u.id === 'touch-typing') s.typingMult *= u.value ** n
    if (u.id === 'networking') s.repFloor += u.value * n
    if (u.id === 'time-management') s.spawnSpeed += u.value * n
  }
  return s
}
