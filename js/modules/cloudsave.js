"use strict";
/* ============================================================
   RESERVED MODULE — cloudsave.js
   STATUS: Not implemented. Not loaded by index.html.

   FUTURE RESPONSIBILITY
   Sync the player's save to and from a remote backend (likely via
   firebase.js), so progress can follow a signed-in player across
   devices.

   INTEGRATION RULES (see PROJECT_RULES.md, Section 7 & 11)
   - Must read/write through the existing save shape defined by
     defaultState()/save()/load() in js/state.js. Do not invent a
     parallel save format.
   - Local localStorage stays authoritative during conflicts unless
     the player explicitly chooses to overwrite it with a remote
     save.
   - Must never write a shape to SAVE_KEY that js/state.js's load()
     cannot already merge safely.
   - The existing "Cloud Save" button in the Settings tab
     (js/settings.js, #btnCloud) currently shows a placeholder
     toast. When this module is implemented, that handler is the
     intended integration point — replace the placeholder behavior
     there, don't add a second cloud-save entry point in the UI.

   This file intentionally contains no executable logic yet.
   ============================================================ */
