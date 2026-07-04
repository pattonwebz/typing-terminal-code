// Snippet bank, tiered by difficulty. Higher tiers pay more per character
// (see TIER_BONUS) and unlock as total LoC earned grows.
export const TIERS = [
  { name: 'Script Kiddie', unlockAt: 0, multiplier: 1 },
  { name: 'Junior Dev', unlockAt: 500, multiplier: 1.5 },
  { name: 'Senior Dev', unlockAt: 5000, multiplier: 2.5 },
]

export const SNIPPETS = [
  // Tier 0 — short and simple
  { tier: 0, code: `console.log("hello world");` },
  { tier: 0, code: `let count = 0;` },
  { tier: 0, code: `const sum = a + b;` },
  { tier: 0, code: `if (x > 10) return true;` },
  { tier: 0, code: `items.push(newItem);` },
  { tier: 0, code: `const name = user.name;` },
  { tier: 0, code: `for (let i = 0; i < 10; i++) {}` },
  { tier: 0, code: `return arr.length;` },

  // Tier 1 — a full expression or short function
  { tier: 1, code: `const evens = nums.filter(n => n % 2 === 0);` },
  { tier: 1, code: `document.querySelector("#app").textContent = "done";` },
  { tier: 1, code: `const total = prices.reduce((a, b) => a + b, 0);` },
  { tier: 1, code: `setTimeout(() => console.log("tick"), 1000);` },
  { tier: 1, code: `const { id, name } = await fetchUser(userId);` },
  { tier: 1, code: `export default function App() { return <h1>Hi</h1>; }` },
  { tier: 1, code: `const sorted = [...items].sort((a, b) => a.rank - b.rank);` },

  // Tier 2 — longer, trickier punctuation
  {
    tier: 2,
    code: `const debounce = (fn, ms) => {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n};`,
  },
  {
    tier: 2,
    code: `async function retry(fn, tries = 3) {\n  for (let i = 0; i < tries; i++) {\n    try { return await fn(); } catch (e) {}\n  }\n  throw new Error("out of retries");\n}`,
  },
  {
    tier: 2,
    code: `const groupBy = (arr, key) =>\n  arr.reduce((acc, item) => {\n    (acc[item[key]] ??= []).push(item);\n    return acc;\n  }, {});`,
  },
]

export function availableTiers(totalLoc) {
  return TIERS.map((t, i) => i).filter((i) => totalLoc >= TIERS[i].unlockAt)
}

export function randomSnippet(totalLoc, excludeCode) {
  const tiers = availableTiers(totalLoc)
  const pool = SNIPPETS.filter(
    (s) => tiers.includes(s.tier) && s.code !== excludeCode
  )
  return pool[Math.floor(Math.random() * pool.length)]
}
