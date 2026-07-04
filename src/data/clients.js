// Client roster. Personality tags are mechanical hooks:
//   patient  — slower reputation bleed from unfixed bugs
//   nitpicky — finds shipped bugs sooner
//   cheap    — lower pay, higher spawn weight
//   whale    — high pay, harsh reputation swings
//   rush     — more likely to post rush tickets
// `eras` lists which eras the client appears in.
export const CLIENTS = [
  {
    id: 'bobs-flooring',
    name: "Bob's Discount Flooring",
    blurb: 'Pays late, loves marquees, forwards you chain emails.',
    tags: ['patient', 'cheap'],
    eras: ['html', 'php', 'js', 'spa', 'ai'],
  },
  {
    id: 'st-agnes',
    name: 'St. Agnes Parish Newsletter',
    blurb: 'Sweet as pie, but has opinions about fonts.',
    tags: ['patient', 'nitpicky'],
    eras: ['html', 'php', 'js'],
  },
  {
    id: 'xtreme-energy',
    name: 'XTREME Energy Drink Co.',
    blurb: 'Wants everything to spin. Needed it yesterday.',
    tags: ['rush'],
    eras: ['html', 'php', 'js', 'spa'],
  },
  {
    id: 'chen-associates',
    name: 'Chen & Associates, Attorneys',
    blurb: 'Deep pockets. Zero tolerance. Reads the contract.',
    tags: ['whale', 'nitpicky'],
    eras: ['php', 'js', 'spa', 'ai'],
  },
  {
    id: 'rusty-anchor',
    name: 'The Rusty Anchor Pub',
    blurb: 'The menu is a PDF. The menu will always be a PDF.',
    tags: ['patient', 'cheap'],
    eras: ['html', 'php', 'js', 'spa', 'ai'],
  },
  {
    id: 'sunrise-yoga',
    name: 'Sunrise Yoga Collective',
    blurb: 'Radiates calm. Will insist on WordBuildr™.',
    tags: ['patient'],
    eras: ['js', 'spa', 'ai'],
  },
]

export function clientsForEra(eraId) {
  return CLIENTS.filter((c) => c.eras.includes(eraId))
}
