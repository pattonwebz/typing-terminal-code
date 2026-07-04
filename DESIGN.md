# typing-terminal — Game Design

An incremental browser game about a web developer's career. Core loop: type
real code, earn currency, buy upgrades. Everything around that loop is
era-based progression with a ticket manager as the hub.

## Career arc: Freelance → Agency → Singularity

## Eras

Each era changes what you type, what mechanics are active, and how buggy you
are. Advancing is a soft prestige: some upgrades reset, permanent
**Experience** is granted.

1. **HTML Era (1998)** — `<table>` layouts, `<font>` tags. Pure manual
   typing. Tickets: "make me a homepage."
2. **PHP Era** — dynamic sites, SQL. Unlocks the database (passive
   multiplier) and the first bug tickets (old HTML work breaks).
3. **JavaScript Era** — jQuery → ES6 → async. Unlocks frameworks: big
   multipliers that periodically go *deprecated* and decay.
4. **Framework/SPA Era** — React/Vue, build tooling. Unlocks automation
   (interns, juniors, CI) — code writes itself slowly.
5. **AI Era (endgame)** — you type prompts, not code. The AI types at
   superhuman WPM; your job becomes reviewing diffs. Final upgrade: the AI
   no longer needs you (ascension).

## The Ticket Manager (hub)

A board with 3–5 open tickets; picking one defines what you type and the pay.

- **Ticket types**: Feature (normal snippet), Bug Fix, Client Request
  (page builder), Rush (timed, 3x pay, misses hurt double), Refactor (long
  snippet, big completion bonus).
- **Clients** have flavor and memory: recurring clients build **Reputation**
  → better-paying tickets. Unfixed bugs tagged to a client bleed reputation.
- Tickets regenerate over time. Board upgrades: more slots, better ticket
  quality, auto-triaging PM.

## The Bug System

Bugs are the emotional throughline: you master each era, then the AI era
takes mastery away.

**Sources of bugs:**

1. **Your own typing.** A fraction of typos made during a ticket ship
   silently into the deliverable. Sloppier ticket → buggier deliverable.
2. **Clients find them later.** Shipped bugs sit dormant in completed work;
   over time a client finds one and a Bug Fix ticket spawns, tagged to that
   client. Fix fast → reputation restored; ignore → reputation bleeds.
3. **Passive income.** Every auto-generated batch of LoC (interns, CI, AI)
   carries a bug rate. Automation is never free.

**Era proficiency curve:** each era has a proficiency track.

- Early era: moderate bug rate (e.g. ~30% of typos ship; even perfect
  tickets carry a small footgun chance).
- Completing tickets raises proficiency: ship rates fall, clients find
  fewer issues, fix-it tickets highlight bugs instead of hiding them.
- Entering the next era resets proficiency for the new tech: messier but a
  higher pay ceiling. This is the pressure to prestige — old eras are clean
  but plateaued.

**AI era inversion:**

- The AI produces huge LoC volume at a high and *rising* bug rate.
- **Unmaintainable code** is a separate meter from bugs: it works, but
  multiplies the cost/frequency of every future bug fix in that codebase.
- **Review is the gameplay**: AI output streams in as diffs; accept/reject
  hunks. Miss a bad hunk → it ships. Reject a good one → lose the LoC.
  Spotting bad code in a given language requires that era's proficiency —
  mastery earned earlier pays off at the end.
- Failure spiral: unmaintainable code → more bugs → more AI "fixes" → more
  unmaintainable code. Endgame upgrades (tests, standards, actually reading
  the diff) break the loop and lead to ascension.

**Tuning principle:** bugs redirect income rather than destroy it — a buggy
backlog forces you into well-paying fix-it work instead of features; only
unattended bugs bleed reputation.

## Side mechanic: Fix-It Tickets

The snippet arrives pre-filled with 2–5 wrong characters/tokens. You spot and
correct only those. High pay per keystroke. At low proficiency bugs are
hidden; higher proficiency highlights them. Passive income generating bugs
gives idle players a reason to return and actively type ("tech debt" meter
penalizes an ignored backlog).

## Side mechanic: Page Builder Hell

A lucrative client insists on **WordBuildr™**, a deliberately awful visual
builder mini-game that suspends typing entirely:

- Terrible UI on purpose: nested accordions, settings gear inside a settings
  gear, confirm modals, a save button that moves, sliders where a number
  input belongs.
- Trivial task ("make the button blue"), hostile interface. Pays 5–10x.
- **Rage meter**: misclicks fill it; when full, unleash "rewrite it from
  scratch" — converts the ticket into a giant typing snippet at bonus rates.
- Upgrades make it slightly less awful, never pleasant.

## Currencies & meters

| Currency | Earned by | Spent on |
| --- | --- | --- |
| LoC | typing | skill upgrades |
| Money ($) | completing tickets | business upgrades (hires, tools, office) |
| Reputation | clean, prompt work | gates better tickets (not spent) |
| Tech Debt | passive income (anti-currency) | reduced via fix-it work |
| Experience | era transitions (prestige) | permanent multipliers |

## Build order

1. Design doc + data model refactor (tickets, clients, eras as data).
2. Ticket board UI replacing the bare snippet pane; Money as second currency.
3. HTML-era snippet bank + era-gating of snippets and upgrades.
4. Fix-it ticket mechanic (typing engine "diff mode").
5. Bug lifecycle: shipped bugs, client discovery, tech-debt loop.
6. Page Builder Hell mini-game (all-new UI, biggest standalone chunk).
7. Era transitions + Experience prestige + proficiency curves.
8. AI era endgame: prompt typing, diff review, unmaintainable-code spiral,
   ascension.

## Current state (v0)

Minimal loop shipped: char-by-char typing engine with combo/crit
(`src/TypingPane.jsx`), tiered snippet bank (`src/snippets.js`), five flat
upgrades (`src/upgrades.js`), localStorage saves with offline passive income
(`src/useGameState.js`).
