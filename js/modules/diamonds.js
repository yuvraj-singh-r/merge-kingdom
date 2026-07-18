"use strict";

/* ============================================================
   MODULE — diamonds.js
   STATUS: Implemented — Premium Currency ("Gems").

   RESPONSIBILITY
   The second, premium currency parallel to coins that this file
   was reserved for (see PROJECT_RULES.md's reserved-module table).
   Shipped as "Gems" — state.gems / addGems() / spendGems() /
   hasEnoughGems() — rather than the doc's original "diamonds"
   naming; PROJECT_RULES.md's reserved-module table has been
   updated in this same change so the doc and code don't drift
   apart (Section 11, rule 5).

   - Owns state.gems (added additively in state.js's defaultState(),
     with gems:0 as the safe default for old saves — see Section 7).
   - Owns its own economy helpers, mirroring economy.js's
     addCoins()/spendCoins() pattern, instead of overloading those
     functions (Section 6.6 / Section 11 reserved-module rule).
   - Every mutation calls the existing updateTopbar() so #gemDisplay
     in the HUD updates immediately, the same way coins already do.
   - No shop or billing integration yet (both are still separate
     reserved modules) — nothing calls these functions until a
     future feature deliberately opts in.
   - Per Section 10: today gems are a plain client-side balance, the
     same trust level as coins. If a future billing.js ever grants
     gems for real money, that balance must be server-verified
     before being treated as authoritative — this file alone must
     never assume a balance it holds is payment-verified.
   ============================================================ */

function addGems(n){
  n=Math.round(n);
  state.gems+=n;
  state.lifetimeGems=(state.lifetimeGems||0)+n;
  updateTopbar();
}
function hasEnoughGems(n){
  return state.gems>=n;
}
function spendGems(n){
  if(!hasEnoughGems(n)) return false;
  state.gems-=n; state.totalGemsSpent=(state.totalGemsSpent||0)+n; updateTopbar(); return true;
}
