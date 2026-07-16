"use strict";
/* ============================================================
   RESERVED MODULE — ads.js
   STATUS: Not implemented. Not loaded by index.html.

   FUTURE RESPONSIBILITY
   Rewarded and/or interstitial ad integration (e.g. watch an ad
   for bonus coins).

   INTEGRATION RULES (see PROJECT_RULES.md, Section 10 & 11)
   - Sandboxed to this file. Must not be granted direct write
     access to `state` — rewards are granted by calling the
     existing addCoins()/addXP() in js/economy.js through an
     explicit, narrow function, so a third-party SDK bug or
     malicious update can't corrupt save data or grant unbounded
     currency.
   - Must not alter gameplay pacing/logic based on ad SDK state;
     ads are a reward delivery mechanism, not a gameplay gate.

   This file intentionally contains no executable logic yet.
   ============================================================ */
