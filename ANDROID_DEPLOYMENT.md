# Merge Realms — Android (Capacitor) Deployment Notes

This project is a static, dependency-free multi-file web app (see
`PROJECT_RULES.md`), which is exactly the project shape Capacitor's
"no bundler" integration path supports. This document covers what's
already been prepared here, and the steps that require the Android
SDK / a real device or emulator — which aren't available in this
environment, so they're recorded as accurate instructions rather
than a fabricated build output.

## What's already in this repo

- **`capacitor.config.json`** — `appId: com.mergerealms.app`,
  `webDir: "."` (this project has no build step, so the web root
  *is* the deploy root), native splash configured to stay visible
  (`launchAutoHide:false`) until `js/capacitor.js`'s
  `hideNativeSplash()` hands off to the web loading screen — see
  that file's header comment for why.
- **`js/capacitor.js`** — the only file that touches the Capacitor
  bridge. Everything in it is guarded by `isNativeApp()`, so it's a
  complete no-op in a normal browser:
  - Android hardware back button (`@capacitor/app`): closes an open
    overlay, then returns to the Kingdom tab, then a "press back
    again to exit" double-tap pattern before actually exiting.
  - Offline banner via `navigator.onLine` / the `online`/`offline`
    events — standard Web APIs, not a Capacitor plugin, so this part
    also works in a normal browser.
  - Status bar color (`@capacitor/status-bar`) matched to the app's
    `--bg-1` token.
- **`assets/android/`** — real, rendered PNG icons at every standard
  density (48/72/96/144/192/512px, generated from `assets/favicon.svg`)
  and a 2732×2732 splash source (generated from `assets/logo.svg`
  composited on the same gradient as the in-app loading screen, so
  there's no visual jump at the native→web handoff).
- **CSS mobile/WebView optimizations** (`css/styles.css`):
  `touch-action:manipulation` + `overscroll-behavior:none` globally
  (prevents accidental pinch/double-tap zoom and Android's
  pull-to-refresh/overscroll glow) without touching the board's own
  `touch-action:none` on `.cell` (that one is load-bearing for
  drag-and-drop merging — do not remove it); `user-select:none`
  globally with an explicit `user-select:text` override on
  `input`/`textarea`/`[contenteditable]` so the bug report form
  stays usable; `env(safe-area-inset-*)` padding on the topbar and
  full-screen loading/splash screens for notches and gesture bars.

## Steps that need the Android SDK (not runnable here)

`package.json` already lists the exact Capacitor packages this
project needs (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`,
`@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`,
`@capacitor/network`) plus dev tooling (`@capacitor/cli`,
`@capacitor/assets`) and convenience scripts:

```bash
npm install
npm run cap:add:android
npm run cap:sync
npm run android:assets   # generates adaptive icons + every splash density
                          # from assets/logo.svg / assets/android/splash.png
npm run cap:open:android
```

## AndroidManifest.xml — recommended entries

Capacitor's generator produces a working manifest; these are the
specific additions/checks worth making for this game once it exists:

- **Internet permission** (required for Firebase Auth/Firestore —
  Cloud Save, Leaderboard, Google Sign-In):
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  ```
- **Orientation**: the layout is fully responsive (`clamp()`/`vw`
  sizing throughout, tile size capped via `--tile-size:min(15vw,58px)`),
  so no orientation lock is required. If a portrait-only experience
  is preferred instead, set on the main activity:
  ```xml
  android:screenOrientation="portrait"
  ```
- **Exported activity** (required on Android 12 / API 31+ for any
  activity with an intent-filter, which the main launcher activity
  has by default):
  ```xml
  android:exported="true"
  ```
- **Hardware acceleration** (on by default on modern Android, but
  worth confirming given the CSS animations/particle effects added
  in the UI Polish pass):
  ```xml
  android:hardwareAccelerated="true"
  ```
- **`android:usesCleartextTraffic="false"`** — this app only talks to
  Firebase/Google over HTTPS, so cleartext traffic should stay
  disabled (Capacitor's default).

## Performance notes specific to this game

- `js/main.js`'s boot sequence already gates real init (asset load,
  save-data check, Firebase with a 4s timeout fallback) rather than
  a fake progress bar — see the "BOOT SEQUENCE" section in that file.
  On a real device this typically finishes in well under a second;
  the 4s ceiling only matters when Firebase is unreachable.
- `backdrop-filter` (used for the glass panel/modal look added in
  the UI Polish pass) is intentionally scoped to only `.panel`,
  `.overlay`, and `.modal` — at most one or two instances on screen
  at once — specifically to avoid the GPU cost of blurring the many
  repeated `.card`/`.qitem`/`.lb-row` elements that can render
  simultaneously (e.g. 32 achievement rows). Those instead use a
  cheap inset-shadow "highlight border" for a similar premium feel.
- All animations (tile pop, particles, floating text, ripples, panel
  transitions) run on `transform`/`opacity` so they stay on the
  compositor thread, and every animation respects
  `prefers-reduced-motion`.
- Background music and every sound effect are synthesized live via
  the Web Audio API (see `js/audio.js`) — there are no audio files
  to download or decode, which keeps both startup time and memory
  footprint low regardless of how long a session runs.
