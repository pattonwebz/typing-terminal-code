# typing-terminal — Build Tasks

Companion to [DESIGN.md](DESIGN.md). Each step below is one milestone from
the build order, broken into concrete tasks. Sections marked **Flavor
hooks** collect the writable surface (names, copy, jokes) — a reviewing AI
is expected to enhance these without changing mechanics.

Conventions for all steps:

- Small commits, one logical chunk each.
- All game content (snippets, tickets, clients, upgrades, eras, perks) lives
  in data files, never hardcoded in components — flavor must be editable
  without touching logic.
- Every step ends with the game playable (`npm run dev`), the build green
  (`npm run build`), and the save format migrated or versioned
  (`typing-terminal-save-vN`).

---

## Step 1 — Data model refactor

**Goal:** turn the v0 "random snippet + flat shop" into a data-driven model
of eras, clients, and tickets, without changing visible gameplay yet.

**Tasks:**

- [x] Define `src/data/eras.js`: id, name, year/vibe, unlock order, snippet
      pool key, base pay multiplier, proficiency curve params (placeholder
      numbers fine; tuned later).
- [x] Define `src/data/clients.js`: id, name, blurb, personality tags
      (patient/nitpicky/cheap/whale), which eras they appear in.
- [x] Define `src/data/ticketTypes.js`: feature / bugfix / clientRequest /
      rush / refactor — pay formula inputs, snippet length range, spawn
      weights per era.
- [x] Introduce a `Ticket` shape: `{ id, type, clientId, era, snippet,
      payLoC, payMoney, createdAt, deadline?, shippedBugs[] }`.
- [x] Restructure game state: `{ currencies: { loc, money }, era,
      proficiency, owned, tickets: { open, active, completed }, savedAt }`.
      Write a v1→v2 save migration.
- [x] Keep current gameplay working on top of the new model (a single
      auto-picked feature ticket behaves like today's random snippet).

**Acceptance:** game plays identically to v0; state shape and data files
match the above; old saves migrate without loss.

**Flavor hooks:** client names and blurbs; era names/taglines; ticket type
display names.

---

## Step 2 — Ticket board + Money

**Goal:** the ticket manager becomes the hub; Money becomes the second
currency.

**Tasks:**

- [x] Board UI: 3–5 open ticket cards (client, type, pay, snippet-length
      hint); click to make active; active ticket feeds the typing pane.
- [x] Ticket generator: spawns tickets over time up to board capacity,
      weighted by era and ticket-type spawn weights.
- [x] Completing a ticket pays LoC (typing, as today) **plus** Money on
      completion; header shows both currencies.
- [x] Split the shop: skill upgrades cost LoC, business upgrades cost
      Money (move Intern to Money; add 1–2 Money upgrades, e.g. "Better
      Chair" and "Ticket Slot +1").
- [x] Abandon-ticket action (small reputation-free penalty for now; real
      reputation arrives in step 5).
- [x] Save migration v2→v3.

**Acceptance:** you always work *on a ticket*; board refills over time;
two currencies earn and spend independently.

**Flavor hooks:** ticket titles/descriptions per client personality
("Bob's Discount Flooring needs a hero image"); Money upgrade names; empty
board copy ("inbox zero, somehow").

---

## Step 3 — HTML era + era gating

**Goal:** the game starts in the HTML era; content and upgrades are gated
by era.

**Tasks:**

- [x] HTML-era snippet bank (~20 snippets): `<table>` layouts, `<font>`,
      `<marquee>`, inline styles, framesets. Tiered short→long.
- [x] PHP-era snippet bank (~15 snippets) so era 2 exists to advance into.
- [x] Gate snippets, ticket types, and clients by era. (Upgrade era-gating
      deferred to step 7, where era-specific upgrades are introduced.)
- [x] Era progress meter: completing tickets fills it; at threshold, an
      "Advance to <next era>" action appears (transition mechanics minimal
      for now — full soft-prestige lands in step 7).
- [x] Theming layer: refactor all component CSS to consume semantic
      variables only (`--panel`, `--accent`, `--text-dim`, …); an era theme
      is a variable set applied at the root (`data-era` attribute), plus at
      most a few era-specific decorations. Components never restyled per
      era.
- [x] HTML-era theme: Geocities energy — grey `#c0c0c0` bevels, Times
      chrome, visitor counter in the footer.
- [x] PHP-era theme: phpBB beige/blue with gradient header bars.
- [x] Effects layer scaffold: one module for juice (floating `+N LoC`
      numbers, combo glow, completion sweep) with flavor text in data;
      respect `prefers-reduced-motion`.
- [ ] Self-host the monospace font (JetBrains Mono or Fira Code) — deferred;
      per-era system-font stacks for UI chrome are done (--font-ui var).

**Acceptance:** new game starts typing 1998 HTML; PHP era reachable and
brings new snippets/tickets/upgrades.

**Flavor hooks:** the snippets themselves (period-accurate, funny), era
advance announcement copy, era taglines.

---

## Step 4 — Fix-It tickets (diff mode)

**Goal:** a second typing mode: correct pre-existing bugs in shown code.

**Tasks:**

- [x] Bug injector: takes a clean snippet, produces 2–5 realistic wrong
      tokens (swapped chars, wrong quote, `=` vs `==`, off-by-one, missing
      semicolon) with positions recorded.
- [x] Diff-mode typing pane: full snippet rendered; player navigates
      (click or arrow keys) to a wrong region and types the correction;
      correct fixes pay high per-keystroke rates.
- [x] Proficiency-based visibility: low proficiency = bugs unmarked (spot
      them yourself); higher = wrong tokens highlighted.
- [x] Bugfix ticket type spawns on the board using this mode.
- [x] Mis-fix penalty: mis-fixes are counted and flavored (adding a new
      bug on mis-fix deferred to step 5's bug lifecycle).

**Acceptance:** bugfix tickets playable end-to-end and pay noticeably
better per keystroke than feature tickets.

**Flavor hooks:** bug ticket titles written as user reports ("site looks
weird on my nephew's computer"); mis-fix flavor lines.

---

## Step 5 — Bug lifecycle, reputation, tech debt

**Goal:** bugs become systemic: you create them, clients find them,
ignoring them costs you.

**Tasks:**

- [x] Shipped bugs: a fraction of typos during a ticket (rate from era
      proficiency) attach to the completed ticket as dormant bugs.
- [x] Passive-income bug rate: intern/automation LoC batches add dormant
      bugs to a general "codebase" pool.
- [x] Client discovery: timer + weighted roll turns dormant bugs into
      bugfix tickets tagged to the original client.
- [x] Reputation stat per client + overall: rises on clean/prompt work,
      bleeds while discovered bugs sit unfixed; gates ticket quality/pay.
- [x] Tech Debt meter: grows with the dormant-bug pool; applies a soft
      earnings penalty above a threshold; reduced by completing bugfix
      tickets.
- [x] Proficiency progression: completing tickets in an era lowers your
      ship-bug rate for that era (the "you get better" curve from
      DESIGN.md).

**Acceptance:** an idle-heavy strategy visibly generates a bug backlog
that pulls the player back to active fix-it play; reputation moves and
matters.

**Flavor hooks:** client bug-discovery messages (angry emails), reputation
tier names, tech-debt warnings.

---

## Step 6 — Page Builder Hell (WordBuildr™)

**Goal:** the hate-mini-game. A clientRequest ticket opens a deliberately
awful visual builder instead of the typing pane.

**Tasks:**

- [x] WordBuildr UI shell: fake builder chrome — panels, accordions,
      toolbar, canvas preview of a tacky client site. Visually clashes
      with every era theme on purpose: bright white corporate SaaS,
      cheerful mascot, drop shadows (own stylesheet, exempt from the
      semantic-variable theming rule).
- [x] Task engine: simple goals ("make the button blue", "bigger heading",
      "move the logo left") verified against builder state.
- [x] Hostile UX toolkit (each a small composable behavior): nested
      accordions, settings-gear-inside-settings-gear, confirm modals,
      moving save button, slider-instead-of-number-input, fake loading
      spinners.
- [x] Rage meter: fills on misclicks/dead-ends; when full, "REWRITE IT
      FROM SCRATCH" converts the ticket into a giant typing snippet at
      bonus rates.
- [x] Pay 5–10x feature tickets; spawn rate low; always optional on the
      board.
- [ ] Upgrades: 1–2 that ease the pain slightly ("bribe vendor for API
      access") without removing it. (Deferred to a balance pass.)

**Acceptance:** the mini-game is genuinely irritating but short (60–120s),
lucrative, and the rage-rewrite release feels great.

**Flavor hooks:** everything — builder branding, panel names, modal copy,
client demands, rage-rewrite text. This step is mostly flavor by design.

---

## Step 7 — Era transitions + Experience + proficiency reset

**Goal:** full soft-prestige loop across all five eras.

**Tasks:**

- [x] JS-era and SPA-era snippet banks (JS bank still small — grow in a
      content pass) and era-specific framework upgrades with deprecation.
- [x] Era transition flow: confirmation screen (what resets, what stays,
      Experience granted), reset of era-specific upgrades + proficiency,
      Experience formula from era performance.
- [x] Experience spend: small permanent-multiplier upgrades usable this
      career.
- [x] Framework deprecation mechanic: JS-era framework upgrades decay on a
      timer with news-ticker announcements.
- [x] JS-era theme (early-2010s flat design, rounded corners arrive) and
      SPA-era theme (modern dark IDE — roughly the v0 look).
- [ ] Balance pass: staying in an old era plateaus; advancing is messy
      (proficiency reset → more bugs) but higher ceiling. (Needs playtest.)

**Acceptance:** a career can progress HTML→SPA with meaningful transition
decisions; Experience visibly compounds.

**Flavor hooks:** transition ceremony copy ("You've learned PHP. God help
you."), fake framework names and deprecation headlines, Experience upgrade
names.

---

## Step 8 — Software Products

**Goal:** build-and-sell arc: invest typing into your own products, choose
a business model, keep them alive with releases and marketing.
(See DESIGN.md "Software Products".)

**Tasks:**

- [x] `src/data/products.js`: product idea templates per era (name, LoC
      budget, base appeal) + marketing channel definitions (era, cost,
      boost, duration, backfire chance for AI-slop).
- [x] Product projects: start one for Money, fill its LoC budget by
      investing typed LoC (simpler than dedicated tickets; revisit if it
      feels flat).
- [x] Launch flow: pick one-off / yearly license / monthly SaaS —
      permanent per product.
- [x] Revenue engine (per game tick): one-off sales with market
      saturation; yearly renewals gated on relevance; SaaS subscriber
      growth/churn with maintenance cost that exceeds revenue at launch
      and crosses over as subscribers compound.
- [x] Relevance decay clock per product (faster in later eras); scales all
      three revenue models.
- [x] Upkeep: update (LoC, relevance top-up) and major release (LoC,
      relevance + saturation reset). Product bugfix tickets from the shared
      bug system deferred. [ ] product-bugfix tickets
- [x] Marketing campaigns: Money → timed demand boost, diminishing
      returns; word-of-mouth trickle scaled by product quality.
- [x] Portfolio UI panel: product cards with model, MRR/sales, relevance
      bar, bug count, action buttons (update / release / market / retire).
- [x] Ascension hook: retired/live products feed the Legacy formula.
- [x] Save migration.

**Acceptance:** a SaaS product visibly loses money at launch and becomes
profitable if maintained; an abandoned product visibly dies; marketing
spend shows a measurable, decaying boost.

**Flavor hooks:** product name generator (era-appropriate: shareware
counters → phpBB mods → jQuery plugins → dev tools → AI wrappers),
marketing channel names and copy, churn/review messages, retirement
eulogies.

---

## Step 9 — AI era, review mode, ascension

**Goal:** the endgame inversion and hard prestige.

**Tasks:**

- [x] Prompt-typing mode: you type prompts (English), the AI "types" the
      resulting code at superhuman speed into the codebase.
- [x] Diff review mode: AI output arrives as hunks; accept/reject each.
      Hunk correctness is hidden; your per-era proficiency from this
      career determines how clearly bad hunks are telegraphed.
- [x] Unmaintainable-code meter: bad accepted hunks raise it; it
      multiplies future bug-fix cost/frequency; distinct UI from Tech
      Debt.
- [ ] Failure spiral tuning + endgame counter-upgrades — needs playtest.
- [x] Pending-Legacy accrual (belongs early, not just this step): every
      scoring action adds to a visible pending-Legacy counter from the
      start of the game; sublinear formula (∝ √lifetime value) with
      per-source weights (LoC, tickets, bugs fixed, reputation, products).
- [x] Ascend-anytime flow: available from the first career, banks pending
      Legacy into the cumulative pool (never spent down by ascending) and
      resets to the HTML era. Confirmation screen shows pending vs. banked.
- [x] AI-era ending as bonus: completing the AI era multiplies that
      career's pending Legacy rather than gating ascension.
- [x] Legacy perk tree (spends from the banked pool): Muscle Memory,
      Industry Contacts, Dotfiles, "I've Seen This Before", Battle Scars,
      Reputation Precedes You.
- [x] AI-era theme: chat-product minimalism, purple gradients, sparkle
      icons — slightly too clean on purpose.
- [ ] Ascension reskin: era tech-stack names shift each career — deferred
      to a content pass.
- [ ] Optional sound pass (default muted) — deferred.

**Acceptance:** a full career is completable; second career starts
faster via Legacy perks; the AI-era review loop feels like a different
game that still rewards earlier mastery.

**Flavor hooks:** AI product name and personality (its commit messages,
its excuses), ascension ceremony copy, perk names/descriptions, per-career
tech-stack reskin tables.
