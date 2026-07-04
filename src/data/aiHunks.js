// AI-era review content: generated "hunks" the player accepts or rejects.
// `tell` is the smell a proficient reviewer gets shown as a hint.
export const AI_NAME = 'ShipItGPT'

export const GOOD_HUNKS = [
  { code: `if (!user) return null;`, note: 'null guard added' },
  { code: `const total = items.reduce((a, b) => a + b.price, 0);`, note: 'sum extracted' },
  { code: `await db.close();`, note: 'connection cleanup' },
  { code: `if (retries > MAX_RETRIES) throw new Error('giving up');`, note: 'bounded retry' },
]

export const BAD_HUNKS = [
  {
    code: `catch (e) { /* handled */ }`,
    tell: 'swallowed exception',
  },
  {
    code: `if (user = admin) { grantAccess(); }`,
    tell: 'assignment in condition',
  },
  {
    code: `setTimeout(() => save(), 100); // fixes race condition`,
    tell: 'sleep-based "fix"',
  },
  {
    code: `const cache = {}; // TODO: invalidate eventually`,
    tell: 'cache without invalidation',
  },
  {
    code: `data.forEach(async (d) => await process(d)); // parallel now`,
    tell: 'unawaited async loop',
  },
]

export const AI_EXCUSES = [
  'That code was correct in my training data.',
  'Works on my inference cluster.',
  'The bug is a feature request in disguise.',
]
