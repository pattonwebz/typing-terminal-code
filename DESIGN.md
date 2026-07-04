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

## Software Products (build & sell your own)

Client tickets are trading time for money; products are the capital arc —
build something once, sell it forever (if you keep it alive). Unlocks
mid-career (around the JS era), when the player has spare LoC/Money.

**Building:** starting a product creates a *project* with a LoC budget you
fill by completing dedicated product tickets (same typing gameplay, no
client, no Money pay — you're investing). At 100% you launch and pick a
**business model**, which is permanent per product:

- **One-off** — each sale pays once. Strong immediate income, decays as the
  market saturates; new *major releases* reset saturation.
- **Yearly license** — smaller per-sale, but each active customer renews
  annually *if* the product stayed relevant that year. Lumpy, loyal income.
- **Monthly SaaS** — subscribers pay continuously **but the product has a
  running maintenance cost** (servers, support) that at launch *exceeds*
  revenue. Subscriber growth compounds; the crossover from money-pit to
  money-printer is the payoff arc. Neglect maintenance and churn spikes.

**Relevance** is the shared decay clock: every product loses relevance over
time (faster in later eras — the treadmill accelerates). Relevance scales
sales, renewals, and subscriber growth. You restore it by shipping:

- **Updates** (small product tickets) — cheap relevance top-up.
- **Fixes** — product bugs spawn from the same bug system as client work
  (your typos, automation); unfixed product bugs accelerate churn and
  relevance loss.
- **Major releases** (big product ticket) — relevance reset + one-off
  saturation reset + a subscriber/sales spike. Sits on a cooldown.

**Marketing** converts Money into demand: campaigns boost sales/subscriber
growth for a duration, with diminishing returns per product. Channels are
era-flavored (webring banners → forum signatures → SEO consultant → social
ads → AI-generated slop that occasionally backfires). An always-on
"word of mouth" trickle scales with product quality (low bug count, high
relevance) so clean engineering is itself marketing.

**Portfolio pressure:** each live product adds tickets to your life
(updates, fixes, releases). A few well-kept products beat many abandoned
ones — abandonware keeps selling one-offs briefly, then reviews tank it.
Products interact with prestige: at ascension, sold/retired products feed
the Legacy formula ("exits").

## Prestige

Two layers, matching the career metaphor.

**Layer 1 — Era transitions (soft, within a career).** Advancing an era
resets era-specific upgrades and proficiency, keeps money and clients, and
grants **Experience** (permanent multipliers for the rest of this career).
Frequent, low-stakes, forward-only.

**Layer 2 — Ascension (hard, ends a career, available from the start).**
Legacy accrues *continuously* from your very first keystroke — every action
(LoC typed, tickets shipped, bugs fixed, reputation gained, page-builder
tickets survived, product exits) adds to a **pending Legacy** counter,
visible from early game. Ascending at any time banks the pending amount
into your cumulative Legacy total and resets the career to the HTML era.

- **No era gate:** you can ascend long before the AI era. Early careers
  bank small amounts; deeper runs accrue faster (later eras and products
  have much higher Legacy yield), so "push further vs. cash out now" is a
  real decision from the first hour.
- **Cumulative:** Legacy is never spent down by ascending — banked Legacy
  only grows across careers. Perk purchases spend from the banked pool.
- **Sublinear accrual** (e.g. Legacy ∝ √lifetime-value) so repeated
  shallow resets don't beat one deep run, but a well-timed early prestige
  still feels great.
- Reaching the AI-era ascension ending is a *bonus multiplier* on that
  career's pending Legacy, not the unlock for prestiging.
- Legacy buys a permanent perk tree — what a veteran actually keeps:
  - **Muscle Memory** — start each era with partial proficiency.
  - **Industry Contacts** — better clients and ticket quality from day one.
  - **Dotfiles** — begin a career with some skill upgrades pre-owned.
  - **"I've Seen This Before"** — fix-it bugs highlighted a tier earlier.
  - **Battle Scars** — rage meter fills faster in Page Builder Hell
    (less patience as a reward).
  - **Reputation Precedes You** — permanent reputation floor.
- Careers accelerate: the first takes days; a full-perk veteran speedruns
  HTML→AI in an hour chasing meta-goals (achievements, career variants like
  a no-automation run).
- Flavor: each ascension shifts the era stacks slightly (PHP era becomes
  Rails-flavored, jQuery becomes Angular…) — the treadmill never ends, only
  your scars accumulate.

## Currencies & meters

| Currency | Earned by | Spent on |
| --- | --- | --- |
| LoC | typing | skill upgrades |
| Money ($) | completing tickets | business upgrades (hires, tools, office) |
| Reputation | clean, prompt work | gates better tickets (not spent) |
| Tech Debt | passive income (anti-currency) | reduced via fix-it work |
| Experience | era transitions (soft prestige) | permanent multipliers (this career) |
| Legacy | accrues from all play; banked on ascension (cumulative) | permanent perk tree (all careers) |

## Visuals & assets: "your screen is the game"

No characters, no world — everything renders as software the developer is
looking at. The art is CSS, typography, and UI chrome; near-zero image
assets.

- **Core aesthetic:** terminal/IDE (the v0 look). Typing pane = editor,
  ticket board = issue tracker, currencies = status bar.
- **Eras are visual skins:** each era retints the whole UI via CSS-variable
  themes. HTML era = Geocities grey bevels + Times chrome + visitor counter;
  PHP era = phpBB beige/blue gradients; JS era = early-2010s flat; SPA era =
  modern dark IDE; AI era = chat-product minimalism, purple gradients,
  sparkles — slightly too clean on purpose.
- **WordBuildr™ deliberately clashes** with every era theme: bright white
  corporate SaaS, cheerful mascot, drop shadows. Visual whiplash is the joke.
- **Assets policy:** inline SVG icons (hand-rolled or embedded Lucide) +
  unicode; one self-hosted monospace (JetBrains Mono / Fira Code) with
  per-era system-font stacks for chrome; no photos — WordBuildr site
  previews are CSS blocks; tiny data-URI patterns if texture is needed.
  No canvas/WebGL/sprite sheets — DOM + CSS only.
- **Juice carries game-feel:** floating `+N LoC` numbers, combo glow, crit
  flash, completion sweep, deprecation news-ticker, rage-meter shake — all
  CSS/JS animation through a small centralized effects layer (so flavor
  text on effects is editable). `prefers-reduced-motion` respected from the
  start.
- **Sound:** later, default-muted; if added, tiny WebAudio-synthesized
  keyboard thock / cash ding, no audio files.
- **Theming discipline:** components consume semantic CSS variables only
  (`--panel`, `--accent`, `--text-dim`); era themes redefine variables and
  add a few decorations, never restyle components — keeps 5 themes × all
  components testable.

## Build order

1. Design doc + data model refactor (tickets, clients, eras as data).
2. Ticket board UI replacing the bare snippet pane; Money as second currency.
3. HTML-era snippet bank + era-gating of snippets and upgrades.
4. Fix-it ticket mechanic (typing engine "diff mode").
5. Bug lifecycle: shipped bugs, client discovery, tech-debt loop.
6. Page Builder Hell mini-game (all-new UI, biggest standalone chunk).
7. Era transitions + Experience prestige + proficiency curves.
8. Software products: build projects, three business models, relevance
   decay, releases/updates/fixes, marketing.
9. AI era endgame: prompt typing, diff review, unmaintainable-code spiral,
   ascension.

## Current state (v0)

Minimal loop shipped: char-by-char typing engine with combo/crit
(`src/TypingPane.jsx`), tiered snippet bank (`src/snippets.js`), five flat
upgrades (`src/upgrades.js`), localStorage saves with offline passive income
(`src/useGameState.js`).
