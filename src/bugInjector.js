// Turns a clean snippet into a buggy one for Fix-It tickets.
// Only same-length single-character substitutions, so bug positions stay
// stable while the player fixes them in any order.
const SUBSTITUTIONS = [
  { from: `'`, to: `"` },
  { from: `"`, to: `'` },
  { from: ';', to: ':' },
  { from: ':', to: ';' },
  { from: '(', to: '[' },
  { from: ')', to: ']' },
  { from: '{', to: '(' },
  { from: '}', to: ')' },
  { from: '<', to: '>' },
  { from: '.', to: ',' },
  { from: ',', to: '.' },
  { from: '=', to: '-' },
  { from: '+', to: '*' },
  { from: '0', to: 'O' },
  { from: '1', to: 'l' },
]

// Neighbor-key typos for letters (QWERTY-ish, kept small on purpose).
const NEIGHBORS = {
  a: 's', s: 'a', d: 'f', f: 'd', e: 'r', r: 'e', t: 'y', y: 't',
  i: 'o', o: 'i', n: 'm', m: 'n', c: 'v', v: 'c', u: 'i', l: 'k',
}

function wrongCharFor(ch) {
  const sub = SUBSTITUTIONS.find((s) => s.from === ch)
  if (sub) return sub.to
  const lower = ch.toLowerCase()
  if (NEIGHBORS[lower]) {
    const w = NEIGHBORS[lower]
    return ch === lower ? w : w.toUpperCase()
  }
  return null
}

// Returns { buggyCode, bugs: [{ pos, wrong, correct }] } with `count`
// injected bugs (fewer if the snippet lacks mutable characters).
export function injectBugs(code, count) {
  const candidates = []
  for (let i = 0; i < code.length; i++) {
    const wrong = wrongCharFor(code[i])
    if (wrong) candidates.push({ pos: i, wrong, correct: code[i] })
  }
  // Shuffle and take `count`, keeping bugs apart so they don't cluster.
  const bugs = []
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  for (const c of shuffled) {
    if (bugs.length >= count) break
    if (bugs.some((b) => Math.abs(b.pos - c.pos) < 4)) continue
    bugs.push(c)
  }
  bugs.sort((a, b) => a.pos - b.pos)
  let buggyCode = code
  for (const b of bugs) {
    buggyCode = buggyCode.slice(0, b.pos) + b.wrong + buggyCode.slice(b.pos + 1)
  }
  return { buggyCode, bugs }
}
