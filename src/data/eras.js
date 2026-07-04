// Era definitions — the progression spine (see DESIGN.md "Eras").
// `proficiency` params drive the bug system from step 5 on:
//   startShipRate  — fraction of typos that ship as bugs when era is new
//   minShipRate    — floor once the era is mastered
//   ticketsToMaster— completed tickets to interpolate between the two
// NOTE: the game currently starts in 'spa' so gameplay matches v0; step 3
// switches the starting era to 'html' when era snippet banks land.
export const ERAS = [
  {
    id: 'html',
    name: 'HTML Era',
    year: 1998,
    tagline: 'You hand-code it. There is no other way.',
    order: 0,
    payMultiplier: 1,
    snippetPool: 'html',
    proficiency: { startShipRate: 0.3, minShipRate: 0.05, ticketsToMaster: 30 },
  },
  {
    id: 'php',
    name: 'PHP Era',
    year: 2004,
    tagline: 'Now with dynamic content. What could go wrong?',
    order: 1,
    payMultiplier: 2.5,
    snippetPool: 'php',
    proficiency: { startShipRate: 0.35, minShipRate: 0.05, ticketsToMaster: 35 },
  },
  {
    id: 'js',
    name: 'JavaScript Era',
    year: 2010,
    tagline: 'The page no longer reloads. Neither do you.',
    order: 2,
    payMultiplier: 6,
    snippetPool: 'js',
    proficiency: { startShipRate: 0.4, minShipRate: 0.06, ticketsToMaster: 40 },
  },
  {
    id: 'spa',
    name: 'Framework Era',
    year: 2018,
    tagline: "It's just a website, but now it needs a build step.",
    order: 3,
    payMultiplier: 15,
    snippetPool: 'spa',
    proficiency: { startShipRate: 0.4, minShipRate: 0.08, ticketsToMaster: 45 },
  },
  {
    id: 'ai',
    name: 'AI Era',
    year: 2026,
    tagline: "You don't write code anymore. You apologize for it.",
    order: 4,
    payMultiplier: 40,
    snippetPool: 'ai',
    proficiency: { startShipRate: 0.6, minShipRate: 0.3, ticketsToMaster: 60 },
  },
]

export function getEra(id) {
  return ERAS.find((e) => e.id === id)
}

export function nextEra(id) {
  const era = getEra(id)
  return ERAS.find((e) => e.order === era.order + 1) ?? null
}
