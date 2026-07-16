"use strict";
/* ============================================================
   RESERVED MODULE — shop.js
   STATUS: Not implemented. Not loaded by index.html.

   FUTURE RESPONSIBILITY
   Storefront UI and logic for spending or purchasing currency on
   cosmetics, boosts, or content.

   INTEGRATION RULES (see PROJECT_RULES.md, Section 6, 8 & 11)
   - Gets its own namespaced state: state.shop (added additively in
     defaultState(), never by repurposing existing fields).
   - UI must reuse the existing tab pattern from js/panels.js
     (.tabbtn / .tabpanel, card-grid components) rather than
     inventing a new navigation or layout paradigm.
   - Spending real coins should go through the existing
     spendCoins() in js/economy.js; spending diamonds should go
     through diamonds.js's equivalent once that module exists.

   This file intentionally contains no executable logic yet.
   ============================================================ */
