Version 1.0
# Merge Kingdom — Multi-File Project

A structured, professional rebuild of the Merge Kingdom browser game.
Gameplay, UI, and every feature are byte-for-byte identical to the
original single-file version — only the file organization changed.

## Structure

```
index.html          Page shell: markup + script/style includes
css/
  styles.css         All game styling (theme tokens, layout, animations)
js/
  data.js            Merge chains, buildings, upgrades, specials, quests, achievements (data tables)
  state.js           Save state shape, save/load, economy formulas (xp curve, multipliers)
  audio.js           WebAudio placeholder sound effects + background music loop
  ui-helpers.js      Toasts, floating text, particles, confetti, modal dialogs
  economy.js         Coin/XP mutation helpers and level-up handling
  board.js           6x6 board rendering, drag-and-drop, auto-merge logic, spawner + holding queue
  panels.js          Buildings/Upgrades/Quests/Achievements/Collection/Inventory/Stats tab rendering + tab switching
  daily.js           Daily login reward + spin wheel
  settings.js        Music/sound/theme toggles, cloud save placeholder, reset
  main.js            Kingdom banner, game loop (tick/autosave), offline earnings, boot sequence
```

## How it works

The scripts are loaded as plain (non-module) `<script src="...">` tags
in dependency order. Classic scripts on the same page share one global
scope, so `js/data.js`'s constants and `js/state.js`'s `state` variable
are visible to every file loaded after them — exactly like the
original single-file build, just split by concern instead of by
comment header.

No bundler, build step, or external library is required. Open
`index.html` directly in a browser, or serve the folder with any
static file server.

## Verified unchanged

- All 6 merge chains, 12 buildings, 9 upgrades, 6 special items
- 12 quests, 50 achievements, full collection book
- Drag-and-drop + auto-merge, spawner/holding queue, daily wheel,
  offline earnings, autosave, dark/light theme — all identical
