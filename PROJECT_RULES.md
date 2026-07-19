# Merge Kingdom — Project Rules

**Status:** Production
**Scope:** This document governs all current and future work on this
codebase. It applies to every contributor — human or AI — making
changes to this project.

> ⚠️ **This is a living production game.** The rules below exist to
> protect gameplay that already works and is already loved by
> players. When in doubt, the safe choice is always the one that
> changes the least.

---

## 0. The Non-Negotiables

These carry over from the project brief and sit above every rule in
this document:

- Never rewrite the project.
- Never replace existing systems.
- Never remove gameplay.
- Never redesign the UI.
- Never delete any feature.
- Preserve every existing mechanic exactly as it is.

If a task appears to require breaking one of these, stop and treat
it as **additive** instead — build beside the existing system, don't
touch it.

---

## 1. Project Architecture

Merge Kingdom is a **static, dependency-free, multi-file browser
game**. There is no build step, no bundler, no package manager, and
no server-side code. It runs by opening `index.html` or serving the
folder statically.

**Runtime model:** all JavaScript files are loaded as classic
(non-module) `<script src="...">` tags, in a fixed order, from the
bottom of `<body>`. Classic scripts on one page share a single
global scope — this is intentional and is how the project achieves
modularity *without* a bundler:

- `js/data.js` defines constants (`CHAINS`, `BUILDINGS`, `UPGRADES`,
  `SPECIALS`, `questDefs()`, `achievementDefs()`) that later files
  read.
- `js/state.js` defines the single `state` object and all save/load
  and economy-formula logic that later files mutate.
- Every subsequent file assumes everything loaded before it already
  exists. **Load order in `index.html` is part of the architecture,
  not an implementation detail** — do not reorder `<script>` tags
  without tracing every dependency.

**Why this architecture:** it lets the game run from a plain file
system (no CORS issues from ES module `fetch`), keeps the mental
model simple (one global game state, one global set of functions),
and avoids introducing a build toolchain into what is otherwise a
zero-dependency project.

Do not introduce a bundler, transpiler, or module system (`import`/
`export`, webpack, vite, etc.) to "modernize" this architecture.
That would count as a rewrite and is explicitly disallowed.

---

## 2. Folder Responsibilities

```
/                     Project root — index.html, docs, config
├── index.html         Page shell only: DOM markup + tag includes
├── PROJECT_RULES.md    This document
├── README.md           Human-facing overview of the file layout
├── css/
│   └── styles.css      All visual styling — the only stylesheet
├── js/
│   ├── data.js          Static game-content tables (read-only at runtime)
│   ├── state.js          Save-state shape, persistence, core formulas
│   ├── audio.js          Sound effects + music synthesis
│   ├── ui-helpers.js     Generic, feature-agnostic UI primitives
│   ├── economy.js        Coin/XP mutation + level-up flow
│   ├── board.js          Merge board: render, drag/drop, merge, spawner
│   ├── panels.js         Tab rendering (build/upgrades/quests/etc.) + tab switching
│   ├── daily.js          Daily reward + spin wheel
│   ├── settings.js       Settings tab behavior (theme, audio toggles, reset)
│   ├── main.js           Boot sequence, game loop, banner, offline earnings
│   └── modules/          Reserved for future systems — see Section 11
```

Rules for folders:

- **`css/`** holds all styling. No inline `<style>` blocks, no
  styling logic inside `.js` files (other than toggling class names
  or CSS custom properties already defined in `styles.css`).
- **`js/`** (top level) holds only files that are part of the
  current, shipped gameplay/UI. Nothing experimental or unused lives
  here.
- **`js/modules/`** holds reserved, not-yet-wired future systems
  (Section 11). Files here must never be `<script>`-included in
  `index.html` until they are deliberately implemented and reviewed.

---

## 3. File Responsibilities

Each file owns one concern. When adding code, put it in the file
that already owns that concern — don't create a second place that
does the same job.

| File | Owns | Does NOT own |
|---|---|---|
| `data.js` | Merge chain definitions, building/upgrade/special/quest/achievement tables | Any mutable state, any DOM access |
| `state.js` | `state` object shape, `defaultState()`, `save()`/`load()`, XP/cost/rate formulas | Rendering, DOM, input handling |
| `audio.js` | `sfx` object, WebAudio synthesis, music start/stop | Game logic, state mutation |
| `ui-helpers.js` | Toasts, floating text, particles, confetti, generic modal | Feature-specific markup or logic |
| `economy.js` | `addCoins`, `spendCoins`, `addXP`, `onLevelUp` | Merge logic, building costs |
| `board.js` | Board rendering, pointer-based drag/drop, auto-merge, spawner, holding queue | Tab UI outside the board |
| `panels.js` | All non-board tabs: build, upgrades, quests, achievements, collection, inventory, stats, tab switching, top bar | Board mechanics, audio |
| `daily.js` | Daily reward eligibility + spin wheel | Any other reward system |
| `settings.js` | Settings tab: theme, audio toggles, cloud-save placeholder, reset | Actual cloud sync (reserved — see `cloudsave.js`) |
| `main.js` | Boot/loading sequence, `beginGame()`, tick loop, autosave interval, offline earnings, banner text | Per-feature UI rendering |

If a change doesn't cleanly fit an existing file's stated
responsibility, it likely belongs in a **new file**, not a bent
version of an existing one (see Section 6 and Section 11).

---

## 4. Coding Standards

- **Vanilla JS only.** No frameworks, no external libraries, no
  build-time transforms. Code must run unmodified in a browser.
- **Classic scripts, shared global scope.** Do not wrap new files in
  an IIFE that hides top-level declarations from other files unless
  that file is fully self-contained and exposes nothing others need.
- **`"use strict"`** at the top of every new `.js` file, matching
  existing files.
- **No global variable collisions.** Before naming a new top-level
  `function`, `const`, or `let`, check every existing file for that
  identifier. Global scope is shared — collisions silently break
  the game.
- **Pure data stays pure.** Files like `data.js` must not read
  `state` or touch the DOM. Keep content tables free of side
  effects so they stay trivially testable.
- **Rendering functions re-render fully, not incrementally.** The
  existing `render*()` functions (`renderBoard`, `renderBuildings`,
  `renderQuests`, etc.) clear and rebuild their container's
  `innerHTML` from current state. New rendering code should follow
  this same pattern rather than introducing incremental DOM patching
  — mixing paradigms causes stale-UI bugs.
- **Defensive persistence.** Any code touching `localStorage` must
  be wrapped in `try/catch`, matching `save()`/`load()`/`hasSave()`.
  Storage can fail (private browsing, quota, disabled) and must
  never crash the game.
- **No blocking calls.** No `alert()`/`prompt()` for gameplay flow
  (the one existing `confirm()` on "New Kingdom" is a deliberate,
  narrow exception for a destructive action). Use the existing
  `showModal()` / `toast()` helpers instead.
- **Comment section headers** for any new file, matching the
  `/* ===== TITLE ===== */` banner style already used throughout the
  codebase, so files stay scannable.

---

## 5. Naming Conventions

- **Files:** lowercase, hyphenated for multi-word names
  (`ui-helpers.js`, not `uiHelpers.js` or `UI_Helpers.js`).
  Single-word files stay single words (`board.js`, `daily.js`).
- **Functions:** `camelCase`, verb-first for actions
  (`renderBoard`, `addCoins`, `checkAchievements`), noun-first only
  for pure getters (`xpNeeded`, `buildingCost`, `queueCapacity`).
- **Constants (data tables):** `UPPER_SNAKE_CASE` for top-level
  static tables (`CHAINS`, `BUILDINGS`, `UPGRADES`, `SPECIALS`,
  `BASE_CHAINS`, `SAVE_KEY`, `DAILY_TABLE`).
- **State fields:** `camelCase`, matching the existing `state`
  object exactly (`lifetimeCoins`, `dailyStreak`, `spawnReady`).
  Never rename an existing state field — see Section 7.
- **IDs in HTML/DOM:** `camelCase` matching existing pattern
  (`spawnIcon`, `xpFill`, `btnReset`). Prefix interactive buttons
  with `btn` as already done (`btnDaily`, `btnContinue`,
  `btnNewGame`).
- **CSS classes:** lowercase, hyphenated (`.tabbtn`, `.qslot`,
  `.card-grid`), matching current stylesheet conventions.
- **New reserved module files** (Section 11) are named exactly as
  listed — lowercase, no hyphens, `.js` extension — so future wiring
  is predictable.

---

## 6. Feature Integration Rules

Adding a feature to Merge Kingdom must never require touching the
internals of an unrelated existing system. Follow this checklist:

1. **Identify the owning file** using Section 3. If none fits,
   create a new file — do not overload an existing one.
2. **Extend `state` additively.** New features get new top-level
   keys in `defaultState()` (e.g. `state.myFeature = {...}`).
   Never repurpose or remove an existing key.
3. **Extend data tables additively.** New buildings, upgrades,
   quests, achievements, or specials are appended to the existing
   arrays in `data.js` with new unique `id`s. Never remove or
   renumber existing entries — ids are load-bearing (they're stored
   in save data and achievement/quest progress).
4. **New UI gets a new tab or a new panel inside an existing tab —
   never replace an existing tab's contents.** Add a `<button
   class="tabbtn" data-tab="...">` and a matching `<section
   class="tabpanel hidden" id="tab-...">` following the existing
   pattern in `index.html`; wire its renderer into `renderForTab()`
   in `panels.js` by adding a new `if` branch, not by editing
   existing branches.
5. **Hook into the game loop additively.** `tick()` in `main.js` may
   gain new *appended* work (e.g. `if (state.myFeature) tickMyFeature();`)
   but existing lines in `tick()` must not be reordered or removed.
6. **Never change function signatures of existing shared helpers**
   (`addCoins`, `addXP`, `showModal`, `toast`, `save`, etc.). Add a
   new optional parameter with a default only if absolutely
   necessary, and confirm every existing call site still behaves
   identically.
7. **New sound effects** are added as new keys on the existing `sfx`
   object in `audio.js`, following the `beep()` pattern already
   there — never modify the frequencies/timings of existing `sfx`
   entries.
8. **Ship features behind a state flag when risk is non-trivial**
   (e.g. `state.settings.myFeatureEnabled`), so a feature can be
   toggled off without a code revert.
9. **Test that existing achievements/quests/collection counts are
   unchanged** after any data.js edit (the project's existing test
   pattern — see `data_check.js`-style headless checks used during
   development — asserts exact counts like "50 achievements"; update
   the *expected* count deliberately, never let it drift silently).

---

## 7. Save System Rules

The save system is the most fragile part of a live game — players'
progress must never be corrupted or reset by a code change.

- **`SAVE_KEY` never changes.** Changing it would orphan every
  existing player's save. If a breaking save-format change is ever
  truly required, introduce a new key and a one-time migration that
  reads the old key, converts it, and writes the new one — never a
  silent break.
- **`defaultState()` is additive-only.** New fields may be added
  with sensible defaults. Existing fields must keep their name and
  meaning forever, because `load()` merges saved data on top of
  `defaultState()` — old saves will simply be missing new fields
  (fine, they'll get the default) but must never be missing
  *renamed* fields (that silently loses progress).
- **`load()`'s merge strategy must be preserved and extended, not
  replaced.** When a new field is an object that needs deep
  defaults (like `maxTier`, `buildings`, `upgrades`, `settings`
  today), add it to the `Object.assign` merge list in `load()`
  rather than assuming a shallow merge is enough.
- **IDs inside save data are permanent contracts.** `chain` keys
  (`grass`, `stone`, ...), `tier` indices, building `id`s, upgrade
  `id`s, quest `id`s, achievement `id`s, and special `id`s are all
  stored directly in player saves (board cells, `buildings`,
  `upgrades`, `questsClaimed`, `achievementsUnlocked`,
  `specialsFound`, `collection`). Never rename or reuse one of these
  ids for a different item — always add a new id instead.
- **`save()` stays defensive.** Any new persistence code must stay
  wrapped in `try/catch` like the existing implementation, and must
  never throw in a way that stops gameplay.
- **Autosave cadence (`save()` every 5s via `saveTimer`, plus
  `beforeunload`) must not be reduced in frequency** without a
  reason tied to measured performance impact — losing more player
  progress on crash/close is a regression.
- **Reserved for `cloudsave.js` (not yet implemented):** cloud sync
  must always treat local `localStorage` as the source of truth
  during conflicts unless the player explicitly chooses otherwise,
  and must never write to `SAVE_KEY` in a shape `load()` doesn't
  already tolerate.

---

## 8. UI Rules

- **No visual redesign.** Colors, spacing, fonts, and component
  shapes defined in `css/styles.css`'s `:root` tokens (`--gold`,
  `--emerald`, `--ruby`, `--panel`, etc.) are the design system.
  New UI must reuse these tokens, not introduce new ad-hoc colors.
- **New UI reuses existing components.** Use the existing `.card`,
  `.card-grid`, `.qitem`, `.statbox`, `.ach`, `.coll` patterns for
  new lists/grids instead of inventing new markup structures.
- **Modals go through `showModal()`.** Toasts go through `toast()`.
  Don't hand-roll new overlay/notification patterns.
- **Tabs are the only top-level navigation.** Don't introduce a
  second navigation paradigm (e.g. a sidebar, a separate route) —
  add a new tab following the existing `.tabbtn` / `.tabpanel`
  pattern instead.
- **Responsive behavior must be preserved.** Any new panel must work
  at both mobile widths (the primary target — see the `--tile-size`
  and `@media(min-width:760px)` rules) and desktop widths without
  horizontal scrolling or overlap.
- **Animations stay consistent.** Reuse existing keyframes (`pop`,
  `glow`, `floatup`, `pfly`, `confettifall`) for new feedback
  moments rather than defining a new animation language.
- **Dark/light theme must both be supported** for any new UI — test
  new panels against the `[data-theme="light"]` overrides, not just
  the default dark theme.
- **Never remove or rename an existing DOM `id`.** Other files query
  elements by id; renaming one is equivalent to deleting a feature
  from every file that references it.

---

## 9. Performance Rules

- **Keep the tick loop cheap.** `tick()` runs every second for the
  entire session. New per-second work must be O(1) or O(small n) —
  never iterate the full board or full achievement list inside
  `tick()` itself (achievement checks already happen event-driven
  via `checkAchievements()`, not on a timer — keep it that way).
- **Re-render only the active tab.** `panels.js` already scopes
  expensive rendering to whichever tab is visible
  (`renderForTab`/`refreshActiveTab`). New tabs must follow the same
  pattern rather than re-rendering hidden tabs on every state
  change.
- **Auto-merge must stay bounded.** `runAutoMergeLoop`'s safety
  counter (currently 200) exists to guarantee termination on a 36-
  cell board. If board size or merge rules ever change, recompute
  and preserve an explicit upper bound — don't remove the guard.
- **Debounce/interval persistence, don't save on every mutation.**
  `save()` is called after discrete user actions (merge, purchase,
  claim) *and* on a 5s timer — that's intentional redundancy for UX,
  not a pattern to multiply. Don't add `save()` calls inside
  high-frequency code paths like `pointermove`.
- **Avoid layout thrash in drag code.** The existing drag
  implementation reads `getBoundingClientRect()` on pointerdown and
  writes `style.left/top` on pointermove. Keep new drag-like
  interactions to this read-once/write-per-frame shape rather than
  reading layout inside `pointermove`.
- **Particles and confetti are capped** (`burstParticles` counts,
  60 confetti pieces). New celebratory effects should stay in
  similar bounds — uncapped DOM node creation on a low-end mobile
  device is a real framerate risk for a "premium mobile game" feel.

---

## 10. Security Rules

Even though this is currently a static client-only game, treat it as
the foundation for the reserved modules (auth, billing, cloud save)
and hold it to that standard now:

- **Never trust client-side state for anything that will eventually
  have real value.** Coins/gems/purchases computed and stored
  client-side today are fine for a local save; once `billing.js`
  exists, any purchased-currency balance must be
  verified server-side before being treated as authoritative —
  client `state` is a cache, not a source of truth, for paid
  currency.
- **No secrets in client code.** API keys for future
  `firebase.js`/`analytics.js`/`playgames.js` integrations must be
  the public, client-safe keys only (e.g. Firebase web config is
  designed to be public; anything that isn't meant to be public,
  like server secrets or admin credentials, must never be committed
  to this repository).
- **Sanitize before rendering.** Any future feature that renders
  user-supplied or server-supplied text (leaderboard names, chat,
  etc.) must not use raw `innerHTML` concatenation the way internal,
  fully-trusted data tables do today. Use `textContent` or an
  escaping helper for anything that didn't originate from
  `data.js`/hard-coded strings.
- **Validate anything loaded from `localStorage` defensively.**
  `load()` already wraps `JSON.parse` in `try/catch` — any future
  code reading additional persisted or remote data must do the
  same, and should not assume shape/types without checking, since a
  tampered or corrupted save must never crash the game or unlock
  paid content for free.
- **No `eval`, no `new Function()`, no dynamically constructed
  script tags** from any data source, ever.
- **Ad and analytics scripts (`ads.js`, `analytics.js`), when
  implemented, must be sandboxed to their own file** and must not be
  granted access to mutate `state` directly — they should read
  through explicit, narrow accessor functions so a third-party SDK
  bug or malicious update can't corrupt save data or grant currency.

---

## 11. Adding Future Features Without Breaking Existing Code

This section is the master procedure for all future work, including
the reserved modules below.

### General procedure

1. **Read this document fully before writing code.**
2. **Add, don't edit, wherever possible.** New file > new function
   in an existing file > new branch in an existing function > new
   parameter on an existing function > editing existing logic. Work
   down that list only as far as necessary.
3. **New state is additive and namespaced.** A new system should own
   a single new top-level `state` key (e.g. `state.shop`,
   `state.diamonds`, `state.leaderboard`) rather than scattering new
   fields across the existing object.
4. **New systems are new files, wired in at the bottom of the load
   order.** Add the new `<script src="js/....js">` tag after
   `main.js`'s tag (or immediately before it, if the new system must
   exist before `main.js`'s boot sequence runs) — never in the
   middle of the existing dependency chain unless the new file is a
   genuine dependency of an existing early file.
5. **Never modify a reserved module's *purpose*** as defined below
   without updating this document in the same change — the doc and
   the code must never drift apart.
6. **Regression check before shipping:** confirm the counts and
   flows called out in Section 6.9 (achievements/quests/collection
   counts, merge chains, save compatibility with an old save file)
   are unchanged, unless the feature explicitly and intentionally
   adds to them.

### Reserved future modules

The following files live in `js/modules/`. Each started as a
documented stub (a header comment describing its future
responsibility); some have since been deliberately implemented and
wired in via `<script>` in `index.html` — see the Status column.
Files still marked **Reserved** must not affect current gameplay in
any way until deliberately built out, following this same procedure.

| File | Status | Responsibility |
|---|---|---|
| `auth.js` | Implemented | Player identity: sign-in/sign-out flow, session/token handling, linking a device save to an account. Does not replace `localStorage` as the primary save — see `cloudsave.js`. |
| `firebase.js` | Implemented | Firebase SDK initialization and shared client config (the app's public web config). Other modules (`auth.js`, `cloudsave.js`, `leaderboard.js`, `analytics.js`) depend on this, not the other way around. |
| `cloudsave.js` | Implemented | Syncs `state` to/from Firestore. Reads/writes through the *existing* `save()`/`load()` shape in `state.js` rather than a parallel save format. Local save stays authoritative on conflict unless the player chooses otherwise (Section 7). |
| `diamonds.js` | Implemented | The second, premium currency parallel to `coins`. Shipped as **Gems** — `state.gems` plus `addGems()`, `spendGems()`, `hasEnoughGems()` — rather than this row's originally-planned `diamonds` naming below. Mirrors `economy.js`'s pattern instead of overloading the existing coin functions. No shop/billing integration yet. |
| `shop.js` | Implemented | Storefront popup with Coin Packs / Gem Packs / Special Items, opened from a new `#btnShop` icon button in the top nav. Ships as a hand-rolled overlay (matching the existing `openDailyWheel()` / Daily Reward popup precedent) rather than this row's originally-planned tab — see the note in the file's own header. Integrates with `state` via `state.shop.purchaseHistory`, reserved for a future `billing.js` to record verified purchases into. Purchasing itself is not implemented yet; `purchaseItem()` is the single stub hook future billing wires into. |
| `billing.js` | Reserved | Real-money purchase flow (IAP / web payments) that grants gems or other entitlements. Any balance it grants must eventually be server-verified (Section 10) before being spendable. |
| `ads.js` | Reserved | Rewarded/interstitial ad integration (e.g. bonus coins for a rewarded ad). Sandboxed per Section 10; must call into `economy.js`'s existing `addCoins`/`addXP` rather than mutating `state.coins` directly. |
| `leaderboard.js` | Implemented | Top-100 global leaderboard across 6 categories (level, coins, gems, achievements, streak, merges), rendered as a real `🏅 Leaderboard` tab. Backed by its own `leaderboard/{uid}` Firestore collection — public-read, owner-write-only, distinct from the private `users/{uid}` cloud-save doc, so it needs its own security rule set server-side. Player-supplied name/avatar are rendered via `.textContent`/`.src` only, never `innerHTML` concatenation, per Section 10. |
| `playgames.js` | Reserved | Google Play Games (or equivalent platform) sign-in, achievements, and cloud save bridging. Should delegate to `auth.js`/`cloudsave.js` rather than re-implementing sign-in or sync. |
| `analytics.js` | Reserved | Event tracking for gameplay/business metrics. Must be call-only (fire-and-forget events) and must never gate or alter gameplay logic based on analytics state. |

**Until implemented, these files exist purely as documentation
anchors** (see each file's header comment). Wiring any of them in is
a deliberate future task, done one module at a time, each following
the full procedure in this section.

---

## Summary

This game already works and is already in players' hands. Every
future change — including the ten reserved modules above — must be
**additive, isolated, and reversible**. When a task in this project
seems to require touching existing gameplay, UI, or save data,
that's the signal to re-read this document and find the additive
path instead.
